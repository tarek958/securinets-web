'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import MatrixBackground from '../components/MatrixBackground';
import StatCard from '../components/StatCard';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        color: '#9CA3AF'
      }
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(239, 68, 68, 0.1)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    },
    x: {
      grid: {
        color: 'rgba(239, 68, 68, 0.1)'
      },
      ticks: {
        color: '#9CA3AF'
      }
    }
  }
};

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/statistics')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.statistics);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching statistics:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading statistics
      </div>
    );
  }

  // Prepare chart data with red theme colors
  const chartData = {
    challenges: {
      labels: stats.challengeStats.map((stat) => stat._id),
      datasets: [{
        label: 'Number of Challenges',
        data: stats.challengeStats.map((stat) => stat.count),
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1
      }]
    },
    solves: {
      labels: stats.solveStats.map((stat) => stat._id),
      datasets: [{
        label: 'Number of Solves',
        data: stats.solveStats.map((stat) => stat.solveCount),
        backgroundColor: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1
      }]
    },
    timeDistribution: {
      labels: stats.solveTimeDistribution.map((stat) => `${stat._id.hour}:00`),
      datasets: [{
        label: 'Solves by Hour',
        data: stats.solveTimeDistribution.map((stat) => stat.count),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    teamSize: {
      labels: stats.teamSizeDistribution.map((stat) => `${stat._id} members`),
      datasets: [{
        data: stats.teamSizeDistribution.map((stat) => stat.count),
        backgroundColor: [
          'rgba(239, 68, 68, 0.3)',
          'rgba(185, 28, 28, 0.3)',
          'rgba(153, 27, 27, 0.3)',
          'rgba(127, 29, 29, 0.3)',
        ],
        borderColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(185, 28, 28, 0.6)',
          'rgba(153, 27, 27, 0.6)',
          'rgba(127, 29, 29, 0.6)',
        ],
        borderWidth: 1
      }]
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-300 p-8">
      <MatrixBackground />
      
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-red-400 mb-12">CTF Statistics</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Users" className="text-center">
            <p className="text-4xl font-bold text-red-400">{stats.totalUsers}</p>
          </StatCard>
          <StatCard title="Teams" className="text-center">
            <p className="text-4xl font-bold text-red-400">{stats.totalTeams}</p>
          </StatCard>
          <StatCard title="Challenges" className="text-center">
            <p className="text-4xl font-bold text-red-400">
              {stats.challengeStats.reduce((acc, curr) => acc + curr.count, 0)}
            </p>
          </StatCard>
          <StatCard title="Total Points" className="text-center">
            <p className="text-4xl font-bold text-red-400">
              {stats.challengeStats.reduce((acc, curr) => acc + curr.totalPoints, 0)}
            </p>
          </StatCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Challenge Distribution">
            <Bar options={chartOptions} data={chartData.challenges} />
          </StatCard>
          <StatCard title="Solve Distribution">
            <Bar options={chartOptions} data={chartData.solves} />
          </StatCard>
          <StatCard title="Solve Activity by Hour">
            <Line options={chartOptions} data={chartData.timeDistribution} />
          </StatCard>
          <StatCard title="Team Size Distribution">
            <Pie data={chartData.teamSize} />
          </StatCard>
        </div>

        {/* First Blood Table */}
        <StatCard title="First Blood Achievements">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left text-red-400">Challenge</th>
                  <th className="px-4 py-2 text-left text-red-400">Category</th>
                  <th className="px-4 py-2 text-left text-red-400">Points</th>
                  <th className="px-4 py-2 text-left text-red-400">Team</th>
                  <th className="px-4 py-2 text-left text-red-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.firstBloods.map((blood, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-red-900/20">
                    <td className="px-4 py-2">{blood.challengeName}</td>
                    <td className="px-4 py-2">{blood.category}</td>
                    <td className="px-4 py-2">{blood.points}</td>
                    <td className="px-4 py-2">{blood.teamName}</td>
                    <td className="px-4 py-2">
                      {new Date(blood.solveTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StatCard>

        {/* Most Solved Challenges */}
        <StatCard title="Most Solved Challenges">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left text-red-400">Challenge</th>
                  <th className="px-4 py-2 text-left text-red-400">Category</th>
                  <th className="px-4 py-2 text-left text-red-400">Points</th>
                  <th className="px-4 py-2 text-left text-red-400">Solves</th>
                  <th className="px-4 py-2 text-left text-red-400">Unique Teams</th>
                </tr>
              </thead>
              <tbody>
                {stats.mostSolvedChallenges.map((challenge, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-red-900/20">
                    <td className="px-4 py-2">{challenge.name}</td>
                    <td className="px-4 py-2">{challenge.category}</td>
                    <td className="px-4 py-2">{challenge.points}</td>
                    <td className="px-4 py-2">{challenge.solveCount}</td>
                    <td className="px-4 py-2">{challenge.uniqueTeamCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StatCard>

        {/* Recent Solves */}
        <StatCard title="Recent Solves">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-2 text-left text-red-400">Team</th>
                  <th className="px-4 py-2 text-left text-red-400">Challenge</th>
                  <th className="px-4 py-2 text-left text-red-400">Category</th>
                  <th className="px-4 py-2 text-left text-red-400">Points</th>
                  <th className="px-4 py-2 text-left text-red-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSolves.map((solve, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-red-900/20">
                    <td className="px-4 py-2">{solve.teamName}</td>
                    <td className="px-4 py-2">{solve.challengeName}</td>
                    <td className="px-4 py-2">{solve.category}</td>
                    <td className="px-4 py-2">{solve.points}</td>
                    <td className="px-4 py-2">
                      {new Date(solve.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StatCard>
      </div>
    </div>
  );
}
