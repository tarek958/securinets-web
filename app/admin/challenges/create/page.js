'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MatrixBackground from '@/components/MatrixBackground';

export default function CreateChallenge() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    flag: '',
    points: '',
    hints: [''],
    files: [],
    active: 'false',
    status: 'inactive'
  });
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories([
          { value: '', display: 'Select Category' },
          ...data.map(cat => ({ value: cat, display: cat }))
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleHintChange = (index, value) => {
    const newHints = [...formData.hints];
    newHints[index] = value;
    setFormData({ ...formData, hints: newHints });
  };

  const addHint = () => {
    setFormData({ ...formData, hints: [...formData.hints, ''] });
  };

  const removeHint = (index) => {
    const newHints = formData.hints.filter((_, i) => i !== index);
    setFormData({ ...formData, hints: newHints });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('difficulty', formData.difficulty);
      formDataToSend.append('points', formData.points);
      formDataToSend.append('flag', formData.flag);
      formDataToSend.append('status', formData.status);
      
      // Add hints
      formData.hints.forEach((hint, index) => {
        if (hint.trim()) {
          formDataToSend.append(`hints[]`, hint);
        }
      });

      // Add files
      formData.files.forEach((file) => {
        formDataToSend.append('files', file);
      });

      const response = await fetch('/api/admin/challenges', {
        method: 'POST',
        headers: {
          'x-user-data': localStorage.getItem('userData')
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create challenge');
      }

      router.push('/admin/challenges');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      <MatrixBackground className="fixed inset-0" />
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-red-500 mb-8">Create Challenge</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 bg-black/40 backdrop-blur-sm rounded-lg border border-red-500/30 p-6 shadow-lg">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[100px]"
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value} className="bg-gray-900">
                    {cat.display}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="" className="bg-gray-900">Select Difficulty</option>
                <option value="Easy" className="bg-gray-900">Easy</option>
                <option value="Medium" className="bg-gray-900">Medium</option>
                <option value="Hard" className="bg-gray-900">Hard</option>
                <option value="Insane" className="bg-gray-900">Insane</option>
              </select>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="inactive" className="bg-gray-900">Inactive</option>
                <option value="active" className="bg-gray-900">Active</option>
              </select>
            </div>

            {/* Flag */}
            <div>
              <label htmlFor="flag" className="block text-sm font-medium text-gray-300 mb-2">
                Flag
              </label>
              <input
                type="text"
                id="flag"
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            {/* Points */}
            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-300 mb-2">
                Points
              </label>
              <input
                type="number"
                id="points"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>

            {/* Files */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-red-500/10 file:text-red-500 hover:file:bg-red-500/20"
              />
              {formData.files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {formData.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-900/40 rounded-lg">
                      <span className="text-sm text-gray-300">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="px-2 py-1 text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hints */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hints
              </label>
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter hint"
                  />
                  <button
                    type="button"
                    onClick={() => removeHint(index)}
                    className="px-4 py-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addHint}
                className="mt-2 px-4 py-2 text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                Add Hint
              </button>
            </div>

         

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 text-white bg-red-500/80 rounded-lg hover:bg-red-500/90 transition-colors"
              >
                Create Challenge
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
