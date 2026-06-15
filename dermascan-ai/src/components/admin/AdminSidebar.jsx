import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Stethoscope, Shield, LifeBuoy, ScrollText, LogOut } from 'lucide-react';
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
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
];

export default function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const { data: pendingRequests } = useQuery({
    queryKey: ['pending-requests-count'],
    queryFn: () => base44.entities.AccountRequest.filter({ status: 'pending' }),
    initialData: [],
  });

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[hsl(210,47%,11%)] text-[hsl(211,90%,96%)] flex flex-col z-40">
      <div className="p-5 border-b border-[hsl(211,90%,29%)]">
        <div className="flex items-center gap-2">
          <AppLogo size="md" className="text-white [&_span]:text-white [&_svg]:text-[hsl(160,68%,37%)]" />
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <Shield className="h-3 w-3 text-[hsl(160,68%,37%)]" />
          <span className="text-xs text-[hsl(211,55%,78%)]">Admin Panel</span>
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
                  ? 'bg-[hsl(160,68%,37%)]/15 text-[hsl(160,68%,37%)]' 
                  : 'text-[hsl(211,55%,78%)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
              {item.badge && pendingRequests.length > 0 && (
                <span className="bg-yellow-500 text-[hsl(210,47%,11%)] text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[hsl(211,90%,29%)] space-y-3">
        <div className="px-3">
          <p className="text-sm font-medium truncate">{user?.full_name || 'Admin'}</p>
          <p className="text-xs text-[hsl(211,55%,78%)] truncate">{user?.email}</p>
        </div>
        <div className="flex items-center justify-between px-3">
          <ThemeToggle className="text-[hsl(211,55%,78%)] hover:text-white" />
          <button
            onClick={() => base44.auth.logout()}
            className="text-[hsl(211,55%,78%)] hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}