'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/Providers';
import { io } from 'socket.io-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import MatrixBackground from '@/components/MatrixBackground';

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', images: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const router = useRouter();

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    setSocket(socketInstance);

    // Listen for post updates
    socketInstance.on('postUpdated', (updatedPost) => {
      setPosts(prev => prev.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      ));
    });

    // Listen for post deletions
    socketInstance.on('postDeleted', ({ postId }) => {
      setPosts(prev => prev.filter(post => post._id !== postId));
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch posts
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg|gif)$/)) {
      setError('File must be a PNG, JPEG, or GIF image');
      return;
    }

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        if (editingPost) {
          setEditingPost(prev => ({
            ...prev,
            images: [...prev.images, { data: base64 }],
          }));
        } else {
          setNewPost(prev => ({
            ...prev,
            images: [...prev.images, { data: base64 }],
          }));
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      if (!response.ok) throw new Error('Failed to create post');

      const post = await response.json();
      setPosts(prev => [post, ...prev]);
      setNewPost({ title: '', content: '', images: [] });
      socket.emit('new-post', post);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content,
          images: editingPost.images,
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      const updatedPost = await response.json();
      setPosts(prev => prev.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      ));
      setEditingPost(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditing = (post) => {
    setEditingPost({ ...post });
  };

  const cancelEditing = () => {
    setEditingPost(null);
  };

  const handleComment = async (postId, content, parentCommentId = null) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, parentCommentId }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const comment = await response.json();
      
      // Update local state
      setPosts(prev =>
        prev.map(post =>
          post._id === postId
            ? {
                ...post,
                comments: [...post.comments, comment],
              }
            : post
        )
      );

      // Emit socket event
      socket.emit(parentCommentId ? 'new-reply' : 'new-comment', {
        postId,
        comment,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative">
      <MatrixBackground className="fixed inset-0" />
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-red-500 mb-8">Forum</h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded mb-6 backdrop-blur-sm">
              {error}
            </div>
          )}

          {/* Create/Edit Post Form */}
          <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-red-500/30 p-6 mb-8 shadow-lg">
            <form onSubmit={editingPost ? handleEdit : handleSubmit}>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Post title"
                  className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={editingPost ? editingPost.title : newPost.title}
                  onChange={(e) => editingPost 
                    ? setEditingPost(prev => ({ ...prev, title: e.target.value }))
                    : setNewPost(prev => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <textarea
                  placeholder="Write your post..."
                  className="w-full px-4 py-2 bg-gray-900/60 border border-red-500/30 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent min-h-[100px]"
                  value={editingPost ? editingPost.content : newPost.content}
                  onChange={(e) => editingPost
                    ? setEditingPost(prev => ({ ...prev, content: e.target.value }))
                    : setNewPost(prev => ({ ...prev, content: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Add Image
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(editingPost ? editingPost.images : newPost.images).map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.data}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border border-red-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingPost) {
                            setEditingPost(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          } else {
                            setNewPost(prev => ({
                              ...prev,
                              images: prev.images.filter((_, i) => i !== index)
                            }));
                          }
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {editingPost && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm text-gray-300 bg-gray-800/60 rounded-lg hover:bg-gray-700/60 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-red-500/80 rounded-lg hover:bg-red-500/90 transition-colors"
                >
                  {editingPost ? 'Save Changes' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post._id} className="bg-black/40 backdrop-blur-sm rounded-lg border border-red-500/30 p-6 shadow-lg hover:border-red-500/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-red-500">{post.title}</h2>
                    <p className="text-sm text-gray-400">
                      Posted by {post.author.username} on {formatDate(post.createdAt)}
                      {post.isEdited && ' (edited)'}
                    </p>
                  </div>
                  {user && user.id === post.author._id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(post)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.images && post.images.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.data}
                        alt={`Post image ${index + 1}`}
                        className="max-w-xs rounded border border-red-500/30 cursor-pointer hover:border-red-500/50 transition-colors"
                        onClick={() => setSelectedImage(image.data)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Image Modal */}
          {selectedImage && (
            <div
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedImage(null)}
            >
              <img
                src={selectedImage}
                alt="Full size"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
