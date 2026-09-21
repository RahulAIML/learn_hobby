import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Gurukul Admin',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1">
        <AdminDashboard />
      </main>
      <Footer />
    </div>
  );
}
