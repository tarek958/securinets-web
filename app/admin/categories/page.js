'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Providers';
import { useRouter } from 'next/navigation';
import { TagIcon } from '@heroicons/react/24/outline';

export default function CategoriesManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchCategories();
  }, [user, router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to fetch categories');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCategory.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Category added successfully');
        setNewCategory('');
        await fetchCategories();
      } else {
        setError(data.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      setError('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch(`/api/categories?category=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Category deleted successfully');
        await fetchCategories();
      } else {
        setError(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await fetch(`/api/categories/${editingCategory}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: editName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Category updated successfully');
        setEditingCategory(null);
        setEditName('');
        await fetchCategories();
      } else {
        setError(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
    }
  };

  return (
    <div className="min-h-screen bg-black text-red-500 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          <TagIcon className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold font-mono">&gt; Categories_Management</h1>
        </div>
        
        {/* Add New Category Form */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-red-500/30">
          <h2 className="text-xl font-semibold font-mono mb-4">&gt; Add_New_Category</h2>
          <form onSubmit={handleAddCategory} className="flex gap-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-500 font-mono transition-colors"
            >
              &gt; Add_Category
            </button>
          </form>
        </div>
 {/* Error and Success Messages */}
 {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-500 font-mono">
            [ERROR]: {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-500 font-mono">
            [SUCCESS]: {success}
          </div>
        )}
        {/* Categories List */}
        <div className="bg-gray-900 rounded-lg p-6 border border-red-500/30">
          <h2 className="text-xl font-semibold font-mono mb-4">&gt; Categories_List</h2>
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category}
                className="flex items-center justify-between p-4 bg-gray-900/60 rounded-lg border border-red-500/30"
              >
                {editingCategory === category ? (
                  <form onSubmit={handleEditCategory} className="flex-1 flex gap-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter new name"
                      className="flex-1 px-4 py-2 bg-gray-800/60 border border-red-500/30 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-500 font-mono transition-colors"
                    >
                      &gt; Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setEditName('');
                      }}
                      className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-gray-400 font-mono transition-colors"
                    >
                      &gt; Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-lg font-mono">{category}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingCategory(category);
                          setEditName(category);
                        }}
                        className="p-2 text-yellow-500 hover:text-yellow-400 focus:outline-none font-mono"
                        title="Edit category"
                      >
                        &gt; Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-2 text-red-500 hover:text-red-400 focus:outline-none font-mono"
                        title="Delete category"
                      >
                        &gt; Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

       
      </div>
    </div>
  );
}
