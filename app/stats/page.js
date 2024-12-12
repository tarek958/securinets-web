'use client';

import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { FaTerminal, FaNetworkWired, FaUsers, FaFlag } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#ef4444',
        font: {
          family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(239, 68, 68, 0.1)',
      },
      ticks: {
        color: '#ef4444',
        font: {
          family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
      },
    },
    y: {
      grid: {
        color: 'rgba(239, 68, 68, 0.1)',
      },
      ticks: {
        color: '#ef4444',
        font: {
          family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
      },
    },
  },
  elements: {
    line: {
      borderColor: '#ef4444',
      tension: 0.4,
    },
    point: {
      backgroundColor: '#ef4444',
    },
  },
};

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ipChartData = {
    labels: stats?.ipHistory?.map(entry => new Date(entry.timestamp).toLocaleString()) || [],
    datasets: [
      {
        label: '> Unique_IP_Connections',
        data: stats?.ipHistory?.map(entry => entry.count) || [],
        fill: true,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: '#ef4444',
      },
    ],
  };

  const teamSolveChartData = {
    labels: stats?.teamSolves?.map(entry => entry.teamName) || [],
    datasets: [
      {
        label: '> Challenges_Solved',
        data: stats?.teamSolves?.map(entry => entry.solveCount) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderColor: '#ef4444',
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-500 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
            <p className="font-mono">[ERROR] {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-mono font-bold mb-8 flex items-center">
          <FaTerminal className="mr-2" />
          &gt; CTF_Statistics_Terminal
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Summary Cards */}
          <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaUsers className="text-2xl mr-2" />
              <h2 className="text-xl font-mono font-semibold">&gt; Total_Users</h2>
            </div>
            <p className="text-4xl font-mono text-red-500">{stats?.totalUsers || 0}</p>
          </div>

          <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <FaFlag className="text-2xl mr-2" />
              <h2 className="text-xl font-mono font-semibold">&gt; Total_Solves</h2>
            </div>
            <p className="text-4xl font-mono text-red-500">{stats?.totalSolves || 0}</p>
          </div>
        </div>

        {/* IP Connections Chart */}
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <FaNetworkWired className="text-2xl mr-2" />
            <h2 className="text-xl font-mono font-semibold">&gt; IP_Connection_Analysis</h2>
          </div>
          <div className="h-[400px]">
            <Line data={ipChartData} options={chartOptions} />
          </div>
        </div>

        {/* Team Solves Chart */}
        <div className="bg-gray-900 border border-red-500/50 rounded-lg p-6">
          <div className="flex items-center mb-6">
            <FaUsers className="text-2xl mr-2" />
            <h2 className="text-xl font-mono font-semibold">&gt; Team_Performance_Matrix</h2>
          </div>
          <div className="h-[400px]">
            <Bar data={teamSolveChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
