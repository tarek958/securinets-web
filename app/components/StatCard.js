'use client';

const StatCard = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-gray-700/50 hover:border-red-500/50 transition-all duration-300 ${className}`}>
      <h3 className="text-xl font-bold mb-4 text-red-400">{title}</h3>
      {children}
    </div>
  );
};

export default StatCard;
