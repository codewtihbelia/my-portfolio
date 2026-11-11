import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TopographicCurvesCanvas } from '../ui/TopographicCurvesCanvas';

export const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white transition-colors font-sans antialiased">
      {/* Dynamic Topographic Moving Contour Lines (Landon Norris Aesthetic) */}
      <TopographicCurvesCanvas />
      
      {/* Content Layer above canvas */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};
