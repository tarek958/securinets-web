'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/Providers';
import MatrixBackground from '@/components/MatrixBackground';

export default function EditChallenge({ params }) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unwrappedParams = use(params);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    points: '',
    flag: '',
    hints: [],
    files: [],
    existingFiles: [],
    status: 'inactive'
  });

  const categories = [
    'Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'Misc'
  ];

  const difficulties = [
    'Easy', 'Medium', 'Hard', 'Insane'
  ];

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchChallenge();
  }, [user, router, unwrappedParams.challengeId]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/admin/challenges/${unwrappedParams.challengeId}`);
      if (!response.ok) throw new Error('Failed to fetch challenge');
      const challenge = await response.json();

      // Transform hints array to match the expected format
      const transformedHints = challenge.hints?.map(h => h.content || h) || [];

      setFormData({
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        points: challenge.points,
        flag: challenge.flag,
        hints: transformedHints,
        existingFiles: challenge.files || [],
        files: [],
        status: challenge.status
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHintChange = (index, value) => {
    const newHints = [...formData.hints];
    newHints[index] = value;
    setFormData(prev => ({
      ...prev,
      hints: newHints
    }));
  };

  const addHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, '']
    }));
  };

  const removeHint = (index) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const removeExistingFile = (index) => {
    setFormData(prev => ({
      ...prev,
      existingFiles: prev.existingFiles.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('points', formData.points);
      formDataToSend.append('flag', formData.flag);
      formDataToSend.append('status', formData.status);
      
      // Transform hints to include content field
      formData.hints.forEach((hint, index) => {
        if (hint.trim()) {
          formDataToSend.append(`hints[${index}][content]`, hint);
          formDataToSend.append(`hints[${index}][cost]`, "0"); // Default cost to 0
        }
      });

      // Handle files
      formData.files.forEach((file) => {
        formDataToSend.append('files', file);
      });
      formDataToSend.append('existingFiles', JSON.stringify(formData.existingFiles));

      const response = await fetch(`/api/admin/challenges/${unwrappedParams.challengeId}`, {
        method: 'PATCH',
        body: formDataToSend,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update challenge');
      }

      router.push('/admin/challenges');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 relative">
        <MatrixBackground />
        <div className="relative z-10">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900/70 p-8 relative">
      <MatrixBackground />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Edit Challenge</h1>
            <button
              onClick={() => router.push('/admin/challenges')}
              className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Challenges
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Select difficulty</option>
                  {difficulties.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>{difficulty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                <input
                  type="number"
                  name="points"
                  value={formData.points}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Flag</label>
              <input
                type="text"
                name="flag"
                value={formData.flag}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="inactive">Inactive</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Hints</label>
                <button
                  type="button"
                  onClick={addHint}
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
                >
                  Add Hint
                </button>
              </div>
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter hint..."
                  />
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Files</label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Add Files
                </label>
              </div>

              {formData.existingFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Existing Files:</h3>
                  <ul className="space-y-2">
                    {formData.existingFiles.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded">
                        <span className="text-gray-300">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeExistingFile(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {formData.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">New Files:</h3>
                  <ul className="space-y-2">
                    {formData.files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded">
                        <span className="text-gray-300">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save Challenge'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
