import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AppLogo from '@/components/AppLogo';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <header className="h-14 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 sticky top-0 z-30 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <AppLogo size="sm" className="ml-3" />
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
