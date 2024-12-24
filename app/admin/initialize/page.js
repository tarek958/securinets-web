'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/Providers';
import MatrixBackground from '@/components/MatrixBackground';

export default function InitializePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentSettings, setCurrentSettings] = useState({
    ctfName: '',
    favicon: null,
    faviconPreview: null
  });

  // Check admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/');
      toast.error('Admin access required');
    }
  }, [user, router]);

  // Fetch current settings on load
  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        setCurrentSettings({
          ctfName: data.ctfName || '',
          favicon: null,
          faviconPreview: data.faviconUrl || null
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load current settings');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (1MB limit)
      if (file.size > 1024 * 1024) {
        toast.error('Favicon must be less than 1MB');
        e.target.value = ''; // Reset file input
        return;
      }

      // Check file type
      const allowedTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/ico', 'image/png', 'image/jpeg', 'image/gif'];
      if (!allowedTypes.includes(file.type) && !file.name.endsWith('.ico')) {
        toast.error('Please upload an ICO file or common image format (PNG, JPEG, GIF)');
        e.target.value = ''; // Reset file input
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentSettings(prev => ({
          ...prev,
          favicon: file,
          faviconPreview: reader.result
        }));
      };
      reader.onerror = () => {
        toast.error('Error reading file');
        e.target.value = ''; // Reset file input
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      toast.error('Admin access required');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('ctfName', currentSettings.ctfName);
      if (currentSettings.favicon) {
        formData.append('favicon', currentSettings.favicon);
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-data': JSON.stringify(user)
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update settings');
      }

      toast.success('Settings updated successfully');
      
      // Update favicon in browser if a new one was uploaded
      if (data.faviconUrl) {
        const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
        favicon.type = 'image/x-icon';
        favicon.rel = 'shortcut icon';
        favicon.href = `${data.faviconUrl}?t=${Date.now()}`; // Add timestamp to force refresh
        document.getElementsByTagName('head')[0].appendChild(favicon);
      }

      router.refresh();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null; // Don't render anything while checking auth
  }

  return (
    <div className="min-h-screen bg-black text-green-500 relative">
      <MatrixBackground />
      <div className="container mx-auto p-4 relative z-10">
        <h1 className="text-4xl font-bold mb-8 text-red-500">Initialize CTF</h1>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-black/50 p-6 rounded-lg border border-red-500/30">
          {/* CTF Name */}
          <div>
            <label htmlFor="ctfName" className="block text-lg font-mono text-red-500 mb-2 glitch">
              [*] CTF_NAME
            </label>
            <input
              type="text"
              id="ctfName"
              name="ctfName"
              value={currentSettings.ctfName}
              onChange={(e) => setCurrentSettings(prev => ({ ...prev, ctfName: e.target.value }))}
              required
              className="w-full px-4 py-2 bg-black/70 text-red-400 border border-red-500/50 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder-red-700/50"
              placeholder="Enter CTF name..."
            />
          </div>

          {/* Favicon */}
          <div>
            <label htmlFor="favicon" className="block text-lg font-mono text-red-500 mb-2 glitch">
              [*] FAVICON_UPLOAD
            </label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                id="favicon"
                name="favicon"
                onChange={handleFileChange}
                accept=".ico,.png,.jpeg,.jpg,.gif"
                className="w-full px-4 py-2 bg-black/70 text-red-400 border border-red-500/50 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-red-500/20 file:text-red-400 hover:file:bg-red-500/30"
              />
            </div>
            {currentSettings.faviconPreview && (
              <div className="mt-4">
                <p className="text-red-500 font-mono mb-2">[+] CURRENT_FAVICON:</p>
                <img
                  src={currentSettings.faviconPreview}
                  alt="Favicon preview"
                  className="w-16 h-16 border border-red-500/30 rounded p-1 bg-black/50"
                />
              </div>
            )}
            <p className="mt-2 text-sm text-red-400/70 font-mono">
              [!] Supported formats: ICO, PNG, JPEG, GIF (max 1MB)
            </p>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-md border border-red-500/50 transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] font-mono disabled:opacity-50"
            >
              {loading ? '[...] SAVING' : '[>] INITIALIZE_SYSTEM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
