import { ReactNode, useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-saral-dark text-white">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex pt-14">
        <Sidebar isOpen={sidebarOpen} />
        <main
          className={`flex-1 transition-all duration-200 ${
            sidebarOpen ? 'md:ml-60' : 'md:ml-20'
          } px-0 sm:px-4 py-2 sm:py-6 pb-20 md:pb-6`}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
