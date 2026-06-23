import React, { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';

interface DoctorSidebarContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const DoctorSidebarContext = createContext<DoctorSidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
});

export const useDoctorSidebar = () => useContext(DoctorSidebarContext);

export default function DoctorLayout() {
  const [open, setOpen] = useState(false);

  return (
    <DoctorSidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      <div className="min-h-screen bg-background">
        <DoctorSidebar open={open} onClose={() => setOpen(false)} />
        <main className="lg:ml-64">
          <Outlet />
        </main>
      </div>
    </DoctorSidebarContext.Provider>
  );
}
