import React from 'react';
import { Outlet } from 'react-router-dom';
import DoctorSidebar from './DoctorSidebar';

export default function DoctorLayout() {
  return (
    <div className="min-h-screen bg-background">
      <DoctorSidebar />
      <main className="ml-64">
        <Outlet />
      </main>
    </div>
  );
}