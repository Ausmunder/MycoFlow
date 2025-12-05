#!/usr/bin/env python3
"""
Delete all batches and units from Sopp Tracker database
WARNING: This will permanently delete ALL data!
"""

import requests
import sys

API_URL = "http://192.168.1.251:8000"

def delete_all_batches():
    """Delete all batches and their associated units"""

    print("⚠️  WARNING: This will delete ALL batches and units!")
    confirm = input("Type 'DELETE ALL' to confirm: ")

    if confirm != "DELETE ALL":
        print("❌ Aborted")
        return

    # Get all batches
    print("\n📋 Fetching all batches...")
    response = requests.get(f"{API_URL}/api/batches")

    if response.status_code != 200:
        print(f"❌ Failed to fetch batches: {response.status_code}")
        return

    batches = response.json()
    batch_ids = [b['id'] for b in batches]

    if not batch_ids:
        print("✅ No batches to delete")
        return

    print(f"📦 Found {len(batch_ids)} batches")

    # Delete all batches using bulk delete
    print("\n🗑️  Deleting all batches...")
    response = requests.post(
        f"{API_URL}/api/batches/bulk-delete",
        json=batch_ids
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Successfully deleted {result['deleted']} batches")
        print(f"   Batch IDs: {batch_ids}")
    else:
        print(f"❌ Failed to delete batches: {response.status_code}")
        print(f"   Response: {response.text}")
        return

    # Verify deletion
    print("\n🔍 Verifying deletion...")
    response = requests.get(f"{API_URL}/api/batches")
    remaining = response.json()
    print(f"✅ Remaining batches: {len(remaining)}")

    if len(remaining) == 0:
        print("\n🎉 All batches and units successfully deleted!")
    else:
        print(f"\n⚠️  Warning: {len(remaining)} batches still remain")

if __name__ == "__main__":
    delete_all_batches()
