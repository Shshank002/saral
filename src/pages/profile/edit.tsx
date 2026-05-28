import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useUser } from '@/lib/useUser';

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading, refresh } = useUser();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?next=/profile/edit');
    }
  }, [loading, user, router]);

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Update failed');
      } else {
        setMessage('Profile updated successfully!');
        refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    setError('');
    setMessage('');
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const res = await fetch('/api/users/me/avatar', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Avatar upload failed');
      } else {
        setMessage('Avatar updated!');
        setAvatarFile(null);
        refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <Link href={`/channel/${encodeURIComponent(user.channelName)}`} className="text-blue-400 hover:underline text-sm">
          View public profile →
        </Link>
      </div>

      {/* Avatar section */}
      <section className="bg-saral-gray rounded-xl p-6 mb-6">
        <h2 className="font-semibold mb-4">Profile Picture</h2>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-saral-primary flex items-center justify-center text-white text-2xl font-bold overflow-hidden flex-shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.channelName} className="w-full h-full object-cover" />
            ) : (
              user.channelName[0].toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={e => setAvatarFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-saral-dark file:text-white hover:file:bg-gray-700"
            />
            {avatarFile && (
              <button
                onClick={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm px-4 py-1.5 rounded-full"
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
              </button>
            )}
            <p className="text-xs text-gray-400 mt-2">JPG, PNG up to 5MB</p>
          </div>
        </div>
      </section>

      {/* Profile details */}
      <form onSubmit={handleSave} className="bg-saral-gray rounded-xl p-6 space-y-4">
        <h2 className="font-semibold">Profile Details</h2>

        <div>
          <label className="block text-sm font-semibold mb-2">Channel Name</label>
          <input
            type="text"
            value={user.channelName}
            disabled
            className="w-full bg-saral-dark border border-gray-700 rounded-lg px-4 py-2 text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">Channel name cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            maxLength={100}
            placeholder="How you want your name to appear"
            className="w-full bg-saral-dark border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell people about yourself or your channel"
            className="w-full bg-saral-dark border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Email</label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="w-full bg-saral-dark border border-gray-700 rounded-lg px-4 py-2 text-gray-400"
          />
        </div>

        {message && (
          <div className="bg-green-900 bg-opacity-50 border border-green-700 text-green-200 px-4 py-2 rounded-lg text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold px-6 py-2 rounded-full"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
