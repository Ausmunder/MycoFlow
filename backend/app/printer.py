"""
Brother QL-820NWB Label Printer Integration
Generates and prints QR code labels for batch tracking
"""
import qrcode
import json
from PIL import Image, ImageDraw, ImageFont
from brother_ql import BrotherQLRaster, create_label
from brother_ql.backends import backend_factory, guess_backend
from datetime import datetime
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class BrotherPrinter:
    """Brother QL-820NWB label printer integration"""

    def __init__(self, printer_identifier='tcp://192.168.1.116', model='QL-820NWB'):
        """
        Initialize printer

        Args:
            printer_identifier: Network address (tcp://IP) or USB path
            model: Printer model (QL-820NWB)
        """
        self.printer_identifier = printer_identifier
        self.model = model
        self.backend_identifier = guess_backend(printer_identifier)
        logger.info(f"Printer initialized: {model} at {printer_identifier}")

    def generate_qr_code(self, data, size=400):
        """
        Generate QR code image

        Args:
            data: String to encode (e.g., "SOPP-123")
            size: QR code size in pixels

        Returns:
            PIL Image object
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)

        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img = qr_img.resize((size, size))

        return qr_img

    def create_batch_label(self, batch, width=62, height=100):
        """
        Create label image for batch

        Args:
            batch: Batch object with id, spawn_batch, strain_name, lc_batch, created_at
            width: Label width in mm (62mm standard)
            height: Label height in mm (100mm for full info)

        Returns:
            PIL Image object
        """
        # Convert mm to pixels (300 dpi)
        # 1mm = 11.81 pixels at 300 dpi
        width_px = int(width * 11.81)  # 62mm ≈ 732px
        height_px = int(height * 11.81)  # 100mm ≈ 1181px

        # Create blank label
        img = Image.new('RGB', (width_px, height_px), 'white')
        draw = ImageDraw.Draw(img)

        # Load fonts (fallback to default if not found)
        try:
            font_large = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 60)
            font_medium = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 40)
            font_small = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 30)
        except:
            try:
                # Windows fonts
                font_large = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 60)
                font_medium = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 40)
                font_small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 30)
            except:
                # Fallback to default
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()
                font_small = ImageFont.load_default()
                logger.warning("Using default fonts - labels may not look optimal")

        # Generate QR code
        qr_data = batch.qr_code or f"SOPP-{batch.id}"
        qr_img = self.generate_qr_code(qr_data, size=400)

        # Paste QR code at top (centered)
        qr_x = (width_px - 400) // 2
        img.paste(qr_img, (qr_x, 50))

        # Add batch info below QR
        y_offset = 480

        # Spawn Batch Name (Large, Bold)
        text = batch.spawn_batch or f"B-{batch.id}"
        try:
            bbox = draw.textbbox((0, 0), text, font=font_large)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(text) * 30  # Rough estimate
        x = (width_px - text_width) // 2
        draw.text((x, y_offset), text, fill='black', font=font_large)
        y_offset += 80

        # Strain (Medium)
        strain_display = {
            'oyster': 'Oyster',
            'lions_mane': 'Lions Mane',
            'shiitake': 'Shiitake'
        }.get(batch.strain_name, batch.strain_name.title())

        text = f"Strain: {strain_display}"
        try:
            bbox = draw.textbbox((0, 0), text, font=font_medium)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(text) * 20
        x = (width_px - text_width) // 2
        draw.text((x, y_offset), text, fill='black', font=font_medium)
        y_offset += 60

        # LC Code (if available)
        if batch.lc_batch:
            text = f"LC: {batch.lc_batch}"
            try:
                bbox = draw.textbbox((0, 0), text, font=font_medium)
                text_width = bbox[2] - bbox[0]
            except:
                text_width = len(text) * 20
            x = (width_px - text_width) // 2
            draw.text((x, y_offset), text, fill='black', font=font_medium)
            y_offset += 60

        # Date (Small)
        if hasattr(batch, 'created_at') and batch.created_at:
            if isinstance(batch.created_at, str):
                date_str = datetime.fromisoformat(batch.created_at.replace('Z', '+00:00')).strftime('%d.%m.%Y')
            else:
                date_str = batch.created_at.strftime('%d.%m.%Y')
            text = f"Opprettet: {date_str}"
            try:
                bbox = draw.textbbox((0, 0), text, font=font_small)
                text_width = bbox[2] - bbox[0]
            except:
                text_width = len(text) * 15
            x = (width_px - text_width) // 2
            draw.text((x, y_offset), text, fill='black', font=font_small)

        # Add border
        draw.rectangle([(10, 10), (width_px-10, height_px-10)], outline='black', width=3)

        return img

    def print_label(self, batch, copies=1):
        """
        Print label for batch

        Args:
            batch: Batch object
            copies: Number of copies to print

        Returns:
            dict: {"success": bool, "message": str, "copies_printed": int}
        """
        try:
            # Create label image
            label_img = self.create_batch_label(batch)

            # Convert to correct format for Brother QL
            qlr = BrotherQLRaster(self.model)
            qlr.exception_on_warning = True

            # Create label instructions
            instructions = create_label(
                qlr,
                label_img,
                '62',  # 62mm label
                threshold=70.0,
                cut=True,
                rotate=0
            )

            # Send to printer
            be = backend_factory(self.backend_identifier)
            be['list_available_devices']()
            be['setup'](self.printer_identifier)

            # Print requested copies
            for i in range(copies):
                be['send'](instructions)
                logger.info(f"Printed label {i+1}/{copies} for batch {batch.id}")

            return {
                "success": True,
                "message": f"Successfully printed {copies} label(s)",
                "copies_printed": copies
            }

        except Exception as e:
            logger.error(f"Print error for batch {batch.id}: {str(e)}")
            return {
                "success": False,
                "message": f"Print failed: {str(e)}",
                "copies_printed": 0
            }

    def test_print(self):
        """
        Print test label to verify printer connectivity

        Returns:
            dict: {"success": bool, "message": str}
        """
        try:
            # Create simple test label
            width_px = int(62 * 11.81)
            height_px = int(100 * 11.81)

            img = Image.new('RGB', (width_px, height_px), 'white')
            draw = ImageDraw.Draw(img)

            # Simple test text
            try:
                font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 50)
            except:
                font = ImageFont.load_default()

            draw.text((150, 400), "Test Label", fill='black', font=font)
            draw.text((100, 500), "Sopp Tracker", fill='black', font=font)
            draw.text((150, 600), datetime.now().strftime('%d.%m.%Y %H:%M'), fill='black', font=font)

            # Add border
            draw.rectangle([(10, 10), (width_px-10, height_px-10)], outline='black', width=3)

            # Print
            qlr = BrotherQLRaster(self.model)
            instructions = create_label(qlr, img, '62', cut=True)

            be = backend_factory(self.backend_identifier)
            be['setup'](self.printer_identifier)
            be['send'](instructions)

            logger.info("Test print successful")
            return {
                "success": True,
                "message": "Test label printed successfully"
            }

        except Exception as e:
            logger.error(f"Test print failed: {str(e)}")
            return {
                "success": False,
                "message": f"Test print failed: {str(e)}"
            }

    def generate_qr_image_bytes(self, qr_data, size=400):
        """
        Generate QR code as PNG bytes for API response

        Args:
            qr_data: String to encode
            size: QR code size in pixels

        Returns:
            bytes: PNG image data
        """
        qr_img = self.generate_qr_code(qr_data, size)

        # Convert to bytes
        img_bytes = BytesIO()
        qr_img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        return img_bytes.getvalue()


# Singleton instance
_printer_instance = None

def get_printer():
    """Get or create printer instance"""
    global _printer_instance
    if _printer_instance is None:
        _printer_instance = BrotherPrinter()
    return _printer_instance
