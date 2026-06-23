import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Users, Archive, BookOpen, LifeBuoy, Settings, LogOut, X } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'New Analysis', path: '/new-analysis', icon: Plus },
  { label: 'Patients', path: '/patients', icon: Users },
  { label: 'Archive', path: '/history', icon: Archive },
  { label: 'User Guide', path: '/guide', icon: BookOpen },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'Settings', path: '/settings', icon: Settings },
];

interface DoctorSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function DoctorSidebar({ open, onClose }: DoctorSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 border-b border-border flex items-center justify-between px-6">
          <AppLogo size="md" />
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="px-3">
            <p className="text-sm font-medium truncate">{user?.full_name || 'Doctor'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.specialty || 'Physician'}</p>
          </div>
          <div className="flex items-center justify-between px-3">
            <ThemeToggle />
            <button
              onClick={() => logout()}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
