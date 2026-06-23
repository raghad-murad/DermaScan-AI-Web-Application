import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useDoctorSidebar } from './DoctorLayout';

export default function DoctorTopbar({ title }) {
  const { user, logout } = useAuth();
  const { toggle } = useDoctorSidebar();

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggle} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Toggle menu">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-heading font-medium">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium hidden sm:block">{user?.full_name || 'Doctor'}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => logout()}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
