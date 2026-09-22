import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CbtResult } from '@/components/cbt/CbtResult';

interface Props {
  params: { attemptId: string };
}

export const metadata = {
  title: 'Assessment Result | Gurukul',
};

export default function CbtResultPage({ params }: Props) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="flex-1">
        <CbtResult attemptId={params.attemptId} />
      </main>
      <Footer />
    </div>
  );
}
