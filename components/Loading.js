export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600"></div>
        <p className="text-indigo-600 text-lg font-semibold">Loading...</p>
      </div>
    </div>
  );
}
