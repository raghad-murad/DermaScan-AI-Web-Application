import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Users, Archive, BookOpen, LifeBuoy, Settings, LogOut } from 'lucide-react';
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

export default function DoctorSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-40">
      <div className="h-16 border-b border-border flex items-center px-6">
        <AppLogo size="md" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
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
  );
}