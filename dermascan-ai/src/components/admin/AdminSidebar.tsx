import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Stethoscope, Shield, LifeBuoy, Settings, LogOut } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const navItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Account Requests', path: '/admin/requests', icon: FileText, badge: true },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Admins', path: '/admin/admins', icon: Shield },
  { label: 'Support Tickets', path: '/admin/tickets', icon: LifeBuoy },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: () => base44.entities.AccountRequest.filter({ status: 'pending' }),
    initialData: [],
  });

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card text-card-foreground flex flex-col z-40 border-r border-border">
      
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <AppLogo size="md" className="[&_svg]:text-primary" />
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = item.path === '/admin' 
            ? location.pathname === '/admin' 
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {item.badge && pendingRequests.length > 0 && (
                <span className="bg-amber-500 dark:bg-amber-600 text-white dark:text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="px-3">
          <p className="text-sm font-semibold truncate text-foreground">{user?.full_name || 'Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <div className="flex items-center justify-between px-3">
          <ThemeToggle className="text-muted-foreground hover:text-foreground transition-colors" />
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