import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/lib/useUser';

// YouTube-style bottom nav bar - only shown on mobile (md:hidden)
export default function MobileBottomNav() {
  const router = useRouter();
  const { user } = useUser();

  const isActive = (path: string) => {
    if (path === '/') return router.pathname === '/';
    return router.pathname.startsWith(path);
  };

  const items = [
    {
      label: 'Home',
      href: '/',
      active: isActive('/') && !router.asPath.includes('shorts'),
      icon: (active: boolean) => (
        <svg
          className="w-6 h-6"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: 'Shorts',
      href: '/shorts',
      active: isActive('/shorts'),
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7v8l10-12h-7V2z" />
        </svg>
      ),
    },
    {
      label: 'Upload',
      href: user ? '/upload' : '/login?next=/upload',
      active: isActive('/upload'),
      isAccent: true,
      icon: () => (
        <div className="w-9 h-9 rounded-full border-2 border-current flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      ),
    },
    {
      label: 'Search',
      href: '/search',
      active: isActive('/search'),
      icon: (active: boolean) => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={active ? 2.5 : 2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      label: user ? 'You' : 'Sign in',
      href: user ? `/channel/${encodeURIComponent(user.channelName)}` : '/login',
      active: user ? isActive('/channel') || isActive('/profile') : false,
      icon: (active: boolean) =>
        user && user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.channelName}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : user ? (
          <div className="w-6 h-6 rounded-full bg-saral-primary flex items-center justify-center text-xs font-bold">
            {user.channelName[0].toUpperCase()}
          </div>
        ) : (
          <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-saral-dark border-t border-gray-800 md:hidden z-40">
      <div className="flex items-center justify-around h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map(item => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full ${
              item.active ? 'text-white' : 'text-gray-400'
            } active:bg-saral-gray rounded-lg transition-colors`}
          >
            {item.icon(item.active)}
            <span className="text-[10px] leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
