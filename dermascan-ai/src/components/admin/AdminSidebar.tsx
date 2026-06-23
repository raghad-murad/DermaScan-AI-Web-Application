import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Stethoscope, Shield, LifeBuoy, Settings, LogOut, X } from 'lucide-react';
import AppLogo from '@/components/AppLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/lib/AuthContext';
import { apiGet } from '@/lib/apiClient';

const navItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Account Requests', path: '/admin/requests', icon: FileText, badge: true },
  { label: 'Doctors', path: '/admin/doctors', icon: Stethoscope },
  { label: 'Admins', path: '/admin/admins', icon: Shield },
  { label: 'Support Tickets', path: '/admin/tickets', icon: LifeBuoy },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    apiGet<any[]>('/api/account-requests/')
      .then(data => setPendingCount(data.filter(r => r.status === 'pending').length))
      .catch(() => setPendingCount(0));
  }, []);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-card text-card-foreground flex flex-col z-50 border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >

        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <AppLogo size="md" className="[&_svg]:text-primary" />
            <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
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
                onClick={onClose}
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
                {item.badge && pendingCount > 0 && (
                  <span className="bg-amber-500 dark:bg-amber-600 text-white dark:text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
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
    </>
  );
}
