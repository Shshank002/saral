import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  {
    label: 'Home',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Shorts',
    href: '/shorts',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M13 2L3 14h7v8l10-12h-7V2z" />
      </svg>
    ),
  },
  {
    label: 'Trending',
    href: '/?filter=trending',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    label: 'Upload',
    href: '/upload',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    label: 'My Channel',
    href: '/channel/SARAL Official',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const router = useRouter();

  return (
    <aside
      className={`fixed top-14 bottom-0 left-0 bg-saral-dark border-r border-gray-800 overflow-y-auto transition-all duration-200 hidden md:block ${
        isOpen ? 'w-60' : 'w-20'
      }`}
    >
      <nav className="py-2">
        {navItems.map(item => {
          const isActive = router.asPath === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center ${
                isOpen ? 'px-4' : 'px-2 justify-center'
              } py-3 mx-2 rounded-lg hover:bg-saral-gray transition-colors ${
                isActive ? 'bg-saral-gray' : ''
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              {isOpen && (
                <span className="ml-4 text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {isOpen && (
        <>
          <div className="border-t border-gray-800 my-2 mx-3" />
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wide">
            Subscriptions
          </div>
          <div className="px-4 py-2 text-sm text-gray-500">
            Sign in to see your subscriptions
          </div>
          <div className="border-t border-gray-800 my-2 mx-3" />
          <div className="px-4 py-3 text-xs text-gray-500">
            <p className="mb-1">SARAL 2026</p>
            <p>Made in India</p>
          </div>
        </>
      )}
    </aside>
  );
}
