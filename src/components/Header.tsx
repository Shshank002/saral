import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, FormEvent, useRef, useEffect } from 'react';
import { useUser } from '@/lib/useUser';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, loading, refresh } = useUser();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMenuOpen(false);
    refresh();
    router.push('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-saral-dark border-b border-gray-800 flex items-center justify-between px-4 z-50">
      {/* Left: Menu + Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-saral-gray rounded-full"
          aria-label="Toggle sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-1">
          <div className="bg-saral-primary text-white font-bold px-2 py-1 rounded text-sm">SARAL</div>
          <span className="text-xs text-gray-400 ml-1">IN</span>
        </Link>
      </div>

      {/* Center: Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 hidden md:flex">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search videos..."
          className="flex-1 bg-saral-gray border border-gray-700 rounded-l-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 border-l-0 rounded-r-full px-6 py-2"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>

      {/* Right: Upload + User */}
      <div className="flex items-center gap-2">
        {/* Upload button - only show if logged in */}
        {user && (
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-saral-gray hover:bg-gray-700 px-3 py-2 rounded-full text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Upload</span>
          </Link>
        )}

        {/* User menu OR Login button */}
        {loading ? (
          <div className="w-8 h-8 bg-saral-gray rounded-full animate-pulse" />
        ) : user ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen(m => !m)}
              className="w-9 h-9 bg-saral-primary rounded-full flex items-center justify-center text-sm font-semibold overflow-hidden hover:ring-2 hover:ring-gray-500"
              aria-label="User menu"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.channelName} className="w-full h-full object-cover" />
              ) : (
                user.channelName[0].toUpperCase()
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-saral-gray border border-gray-700 rounded-xl shadow-xl py-2 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="font-semibold truncate">{user.displayName || user.channelName}</p>
                  <p className="text-xs text-gray-400 truncate">@{user.channelName}</p>
                  {user.email && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                  )}
                </div>

                {/* Menu items */}
                <Link
                  href={`/channel/${encodeURIComponent(user.channelName)}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Your channel
                </Link>

                <Link
                  href="/profile/edit"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Edit profile
                </Link>

                <Link
                  href="/upload"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload video
                </Link>

                <div className="border-t border-gray-700 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700 text-sm w-full text-left"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 border border-gray-700 hover:border-blue-500 text-blue-400 hover:bg-saral-gray px-4 py-1.5 rounded-full text-sm font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
