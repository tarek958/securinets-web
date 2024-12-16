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
import { useRef } from 'react';

// Add download chart function
const downloadChart = (chartRef, title) => {
  const link = document.createElement('a');
  link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
  link.href = chartRef.current.canvas.toDataURL('image/png');
  link.click();
};

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
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Add refs for charts
  const teamProgressionRef = useRef(null);
  const userProgressionRef = useRef(null);
  const categoryDistRef = useRef(null);
  const difficultyDistRef = useRef(null);
  const teamSizeDistRef = useRef(null);
  const solveTimeDistRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (data.success) {
          // Process team progressions
          const processedTeamProgressions = data.statistics.teamProgressions?.map(team => {
           
            const timelinePoints = team.progression?.timeline || [];
            return {
              ...team,
              progression: {
                ...team.progression,
                timeline: timelinePoints
              }
            };
          }) || [];
          
          // Process user progressions
          const processedUserProgressions = data.statistics.userProgressions?.map(user => {
           
            const timelinePoints = user.progression?.timeline || [];
            return {
              ...user,
              progression: {
                ...user.progression,
                timeline: timelinePoints
              }
            };
          }) || [];

          setStats({
            ...data.statistics,
            teamProgressions: processedTeamProgressions,
            userProgressions: processedUserProgressions
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching statistics:', error);
        setLoading(false);
      }
    };

    fetchStats();
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
    <div className="min-h-screen bg-black text-gray-300 relative overflow-hidden">
      <MatrixBackground />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <h1 className="text-6xl font-bold text-center mb-12 text-red-500 cyber-glitch font-mono tracking-wider">
          CTF Statistics
        </h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { title: "Users", value: stats?.totalUsers || 0, subtitle: "Total Registered" },
            { title: "Teams", value: stats?.totalTeams || 0, subtitle: "Active Teams" },
            { title: "Challenges", value: stats?.challengeStats?.reduce((acc, curr) => acc + curr.count, 0) || 0, subtitle: "Total Available" },
            { title: "Total Points", value: stats?.challengeStats?.reduce((acc, curr) => acc + curr.totalPoints, 0) || 0, subtitle: "Maximum Score" }
          ].map((card, index) => (
            <StatCard key={index} title={card.title} 
              className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg
                        transform hover:scale-105 transition-all duration-300 hover:border-red-500
                        hover:shadow-lg hover:shadow-red-500/30 relative overflow-hidden
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-500/0 before:via-red-500/5 before:to-red-500/0
                        before:animate-pulse">
              <div className="text-4xl font-bold text-red-500 mb-2 font-mono glow-text">{card.value}</div>
              <div className="text-sm text-red-400/70">{card.subtitle}</div>
            </StatCard>
          ))}
        </div>

        {/* First Blood and Recent Solves */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* First Blood */}
          <div className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-red-500 mb-6 font-mono glow-text">First Blood</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-red-500/30">
                    <th className="py-2 px-4 text-red-400 font-mono">Challenge</th>
                    <th className="py-2 px-4 text-red-400 font-mono">Team</th>
                    <th className="py-2 px-4 text-red-400 font-mono">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.firstBloods?.map((solve, index) => (
                    <tr key={index} className="border-b border-red-500/10">
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.challengeName}</td>
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.teamName}</td>
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Solves */}
          <div className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-red-500 mb-6 font-mono glow-text">Recent Solves</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-red-500/30">
                    <th className="py-2 px-4 text-red-400 font-mono">Team</th>
                    <th className="py-2 px-4 text-red-400 font-mono">Challenge</th>
                    <th className="py-2 px-4 text-red-400 font-mono">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentSolves?.map((solve, index) => (
                    <tr key={index} className="border-b border-red-500/10">
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.teamName}</td>
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.challengeName}</td>
                      <td className="py-2 px-4 text-red-400/70 font-mono">{solve.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Team and User Progression Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Team Progression Chart */}
          <div className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-red-500 font-mono glow-text">Team Progression</h2>
              <button 
                onClick={() => downloadChart(teamProgressionRef, 'Team Progression')}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 font-mono text-sm transition-all"
              >
                Download
              </button>
            </div>
            <div className="h-[400px]">
              {stats?.teamProgressions?.some(team => team.progression?.timeline?.length > 0) ? (
                <Line
                  ref={teamProgressionRef}
                  data={{
                    labels: [...new Set(stats.teamProgressions
                      .flatMap(team => team.progression?.timeline || [])
                      .map(point => point._id.split(' ')[1].split(':')[0] + 'h')
                      .sort((a, b) => parseInt(a) - parseInt(b))
                    )],
                    datasets: stats.teamProgressions
                      .filter(team => team.progression?.timeline?.length > 0)
                      .map((team, index) => {
                        // Calculate cumulative points
                        let total = 0;
                        const data = team.progression.timeline.map(point => {
                          total += point.points;
                          return total;
                        });
                        
                        return {
                          label: team.name,
                          data: data,
                          borderColor: `hsl(${index * 30}, 70%, 50%)`,
                          backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.1)`,
                          fill: true,
                          tension: 0.4,
                          borderWidth: 2
                        };
                      })
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: {
                            family: 'monospace'
                          },
                          color: '#ef4444'
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(239, 68, 68, 0.1)'
                        },
                        ticks: {
                          color: '#ef4444',
                          font: {
                            family: 'monospace'
                          }
                        }
                      },
                      y: {
                        grid: {
                          color: 'rgba(239, 68, 68, 0.1)'
                        },
                        ticks: {
                          color: '#ef4444',
                          font: {
                            family: 'monospace'
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-red-400/70 font-mono">
                  No team progression data available
                </div>
              )}
            </div>
          </div>

          {/* User Progression Chart */}
          <div className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-red-500 font-mono glow-text">User Progression</h2>
              <button 
                onClick={() => downloadChart(userProgressionRef, 'User Progression')}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 font-mono text-sm transition-all"
              >
                Download
              </button>
            </div>
            <div className="h-[400px]">
              {stats?.userProgressions?.some(user => user.progression?.timeline?.length > 0) ? (
                <Line
                  ref={userProgressionRef}
                  data={{
                    labels: [...new Set(stats.userProgressions
                      .flatMap(user => user.progression?.timeline || [])
                      .map(point => point._id.split(' ')[1].split(':')[0] + 'h')
                      .sort((a, b) => parseInt(a) - parseInt(b))
                    )],
                    datasets: stats.userProgressions
                      .filter(user => user.progression?.timeline?.length > 0)
                      .map((user, index) => {
                        // Calculate cumulative points
                        let total = 0;
                        const data = user.progression.timeline.map(point => {
                          total += point.points;
                          return total;
                        });
                        
                        return {
                          label: user.username,
                          data: data,
                          borderColor: `hsl(${index * 30}, 70%, 50%)`,
                          backgroundColor: `hsla(${index * 30}, 70%, 50%, 0.1)`,
                          fill: true,
                          tension: 0.4,
                          borderWidth: 2
                        };
                      })
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          font: {
                            family: 'monospace'
                          },
                          color: '#ef4444'
                        }
                      }
                    },
                    scales: {
                      x: {
                        grid: {
                          color: 'rgba(239, 68, 68, 0.1)'
                        },
                        ticks: {
                          color: '#ef4444',
                          font: {
                            family: 'monospace'
                          }
                        }
                      },
                      y: {
                        grid: {
                          color: 'rgba(239, 68, 68, 0.1)'
                        },
                        ticks: {
                          color: '#ef4444',
                          font: {
                            family: 'monospace'
                          }
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-red-400/70 font-mono">
                  No user progression data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            { title: "Challenge Distribution", chart: <Bar options={chartOptions} data={chartData.challenges} /> },
            { title: "Solve Distribution", chart: <Bar options={chartOptions} data={chartData.solves} /> },
            { title: "Solve Activity by Hour", chart: <Line options={chartOptions} data={chartData.timeDistribution} /> },
            { title: "Team Size Distribution", chart: <Pie data={chartData.teamSize} /> }
          ].map((chart, index) => (
            <StatCard key={index} title={chart.title}
              className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg
                        hover:border-red-500 transition-all duration-300
                        hover:shadow-lg hover:shadow-red-500/30 relative overflow-hidden
                        before:absolute before:inset-0 before:bg-gradient-to-br before:from-red-500/5 before:to-transparent">
              {chart.chart}
            </StatCard>
          ))}
        </div>

        {/* Tables Section */}
        <div className="space-y-8">
          {[
            {
              title: "Most Solved Challenges",
              headers: ["Challenge", "Category", "Points", "Solves", "Unique Teams"],
              data: stats?.mostSolvedChallenges,
              rowRenderer: (challenge) => [
                challenge.name || challenge.title || 'Unknown Challenge',
                challenge.category,
                challenge.points,
                challenge.solveCount,
                challenge.uniqueTeamCount
              ]
            },
            {
              title: "Recent Solves",
              headers: ["Team", "Challenge", "Category", "Points", "Time"],
              data: stats?.recentSolves,
              rowRenderer: (solve) => [
                solve.teamName,
                solve.challengeName,
                solve.category,
                solve.points,
                new Date(solve.timestamp).toLocaleString()
              ]
            }
          ].map((table, index) => (
            <StatCard key={index} title={table.title}
              className="bg-black/70 backdrop-blur-sm border border-red-500/30 rounded-lg
                        hover:border-red-500 transition-all duration-300
                        hover:shadow-lg hover:shadow-red-500/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-500/10 border-b border-red-500/30">
                    <tr>
                      {table.headers.map((header, i) => (
                        <th key={i} className="px-6 py-3 text-left text-red-400 font-mono">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-500/20">
                    {table.data?.map((item, i) => (
                      <tr key={i} className="hover:bg-red-500/10 transition-colors">
                        {table.rowRenderer(item).map((cell, j) => (
                          <td key={j} className="px-6 py-4 font-mono whitespace-nowrap text-red-300/90">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </StatCard>
          ))}
        </div>

        {/* Solved Challenges Grid */}
        <div className="mt-12">
          <h2 className="text-4xl font-bold mb-8 text-red-500 text-center font-mono cyber-glitch">
            Solved Challenges
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats?.solvedChallenges?.map((challenge) => (
              <div
                key={challenge._id}
                onClick={() => setSelectedChallenge(challenge)}
                className="bg-black/70 backdrop-blur-sm border border-red-500/30 p-6 rounded-lg cursor-pointer hover:bg-red-950/30 hover:border-red-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/30 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-mono border border-red-500/30 group-hover:border-red-500/50">
                      {challenge.category}
                    </span>
                    <span className="text-sm text-red-400/70 font-mono">
                      {challenge.solveCount} solves
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-red-400 mb-3 font-mono glow-text">
                    {challenge.name || challenge.title || `Challenge #${challenge._id.slice(-6)}`}
                  </h3>
                  <p className="text-sm text-red-300/90 font-mono">Points: {challenge.points}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {selectedChallenge && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-black/90 border border-red-500/50 p-8 rounded-lg max-w-3xl w-full shadow-2xl shadow-red-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-3xl font-bold text-red-500 font-mono glow-text">
                    {selectedChallenge.name || selectedChallenge.title || `Challenge #${selectedChallenge._id.slice(-6)}`}
                  </h2>
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-mono border border-red-500/30">
                    {selectedChallenge.category}
                  </span>
                </div>
                
                <div className="space-y-6">
                  <div className="flex gap-8 text-lg">
                    <p className="font-mono"><span className="text-red-400">Points:</span> {selectedChallenge.points}</p>
                    <p className="font-mono"><span className="text-red-400">Total Solves:</span> {selectedChallenge.solveCount}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-red-400 font-mono glow-text">Solved By:</h3>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      <table className="w-full">
                        <thead className="bg-red-500/10 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-red-400 font-mono">User</th>
                            <th className="px-6 py-3 text-left text-red-400 font-mono">Team</th>
                            <th className="px-6 py-3 text-left text-red-400 font-mono">Solved At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-500/20">
                          {selectedChallenge.solves.map((solve) => (
                            <tr key={solve._id} className="hover:bg-red-500/10 transition-colors">
                              <td className="px-6 py-4 font-mono text-red-300/90">{solve?.user?.username || 'Unknown User'}</td>
                              <td className="px-6 py-4 font-mono text-red-300/90">{solve?.user?.team?.name || '-'}</td>
                              <td className="px-6 py-4 font-mono text-red-300/90">{new Date(solve.timestamp).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="mt-8 bg-red-500/20 text-red-400 px-6 py-3 rounded-lg font-mono hover:bg-red-500/30 transition-colors border border-red-500/30 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/30 relative overflow-hidden group"
                >
                  <span className="relative z-10">Close</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(239, 68, 68, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.5);
        }
        .cyber-glitch {
          text-shadow: 
            2px 2px 0px rgba(239, 68, 68, 0.3),
            -2px -2px 0px rgba(239, 68, 68, 0.3),
            0 0 20px rgba(239, 68, 68, 0.5);
          animation: glitch 3s infinite, glow 2s ease-in-out infinite alternate;
        }
        .glow-text {
          text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }
        @keyframes glitch {
          0% {
            text-shadow: 2px 2px 0px rgba(239, 68, 68, 0.3),
                        -2px -2px 0px rgba(239, 68, 68, 0.3),
                        0 0 20px rgba(239, 68, 68, 0.5);
          }
          25% {
            text-shadow: -2px 2px 0px rgba(239, 68, 68, 0.3),
                        2px -2px 0px rgba(239, 68, 68, 0.3),
                        0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% {
            text-shadow: 2px -2px 0px rgba(239, 68, 68, 0.3),
                        -2px 2px 0px rgba(239, 68, 68, 0.3),
                        0 0 20px rgba(239, 68, 68, 0.5);
          }
          75% {
            text-shadow: -2px -2px 0px rgba(239, 68, 68, 0.3),
                        2px 2px 0px rgba(239, 68, 68, 0.3),
                        0 0 20px rgba(239, 68, 68, 0.5);
          }
          100% {
            text-shadow: 2px 2px 0px rgba(239, 68, 68, 0.3),
                        -2px -2px 0px rgba(239, 68, 68, 0.3),
                        0 0 20px rgba(239, 68, 68, 0.5);
          }
        }
        @keyframes glow {
          from {
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
          }
          to {
            text-shadow: 0 0 20px rgba(239, 68, 68, 0.8),
                        0 0 30px rgba(239, 68, 68, 0.6);
          }
        }
      `}</style>
    </div>
  );
}
