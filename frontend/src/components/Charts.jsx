import { useEffect, useRef } from 'react';
import { useBatches } from '../hooks/useApi';
import { Chart, registerables } from 'chart.js';
import { getTotalHarvest, calcBE, formatDate } from '../utils/helpers';

// Register Chart.js components
Chart.register(...registerables);

export default function Charts({ strain, strainConfig }) {
  const { data: batches = [] } = useBatches({ strain, archived: false });
  
  const harvestChartRef = useRef(null);
  const statusChartRef = useRef(null);
  const beChartRef = useRef(null);
  
  const harvestChartInstance = useRef(null);
  const statusChartInstance = useRef(null);
  const beChartInstance = useRef(null);

  // Harvest over time chart
  useEffect(() => {
    if (!harvestChartRef.current || batches.length === 0) return;

    const ctx = harvestChartRef.current.getContext('2d');
    
    // Destroy existing chart
    if (harvestChartInstance.current) {
      harvestChartInstance.current.destroy();
    }

    // Prepare data
    const harvestedBatches = batches
      .filter(b => b.bag_status === 'Hostet' && b.bag_host1_slutt)
      .sort((a, b) => new Date(a.bag_host1_slutt) - new Date(b.bag_host1_slutt));

    const labels = harvestedBatches.map(b => formatDate(b.bag_host1_slutt));
    const data = harvestedBatches.map(b => getTotalHarvest(b));

    harvestChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total høst (kg)',
          data,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: { display: true, text: 'Høst over tid' }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Kg' }
          }
        }
      }
    });

    return () => {
      if (harvestChartInstance.current) {
        harvestChartInstance.current.destroy();
      }
    };
  }, [batches]);

  // Status distribution chart
  useEffect(() => {
    if (!statusChartRef.current || batches.length === 0) return;

    const ctx = statusChartRef.current.getContext('2d');
    
    if (statusChartInstance.current) {
      statusChartInstance.current.destroy();
    }

    // Count batches by status
    const statusCounts = {};
    batches.forEach(b => {
      statusCounts[b.bag_status] = (statusCounts[b.bag_status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const colors = [
      'rgb(59, 130, 246)',  // Inokulert
      'rgb(234, 179, 8)',   // Inkubering
      'rgb(16, 185, 129)',  // Klar
      'rgb(147, 51, 234)',  // I frukting
      'rgb(34, 197, 94)',   // Hostet
      'rgb(239, 68, 68)'    // Forkastet
    ];

    statusChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.slice(0, labels.length),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Status fordeling' }
        }
      }
    });

    return () => {
      if (statusChartInstance.current) {
        statusChartInstance.current.destroy();
      }
    };
  }, [batches]);

  // BE% over time chart
  useEffect(() => {
    if (!beChartRef.current || batches.length === 0) return;

    const ctx = beChartRef.current.getContext('2d');
    
    if (beChartInstance.current) {
      beChartInstance.current.destroy();
    }

    // Calculate BE% for harvested batches
    const harvestedBatches = batches
      .filter(b => b.bag_status === 'Hostet' && b.bag_kg_substrat && b.bag_host1_slutt)
      .sort((a, b) => new Date(a.bag_host1_slutt) - new Date(b.bag_host1_slutt));

    const labels = harvestedBatches.map(b => formatDate(b.bag_host1_slutt));
    const data = harvestedBatches.map(b => parseFloat(calcBE(b.bag_kg_substrat, getTotalHarvest(b))));

    beChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'BE%',
          data,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'BE% trend over tid' }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'BE%' }
          }
        }
      }
    });

    return () => {
      if (beChartInstance.current) {
        beChartInstance.current.destroy();
      }
    };
  }, [batches]);

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-slate-600">Ingen data å vise grafer for</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <canvas ref={harvestChartRef} height="250"></canvas>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <canvas ref={statusChartRef} height="250"></canvas>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <canvas ref={beChartRef} height="250"></canvas>
      </div>
    </div>
  );
}
