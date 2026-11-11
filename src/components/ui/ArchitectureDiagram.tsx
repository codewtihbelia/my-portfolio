import React from 'react';
import { Users, Layout, Server, ShieldCheck, Database, HardDrive, ArrowDown, ArrowRight } from 'lucide-react';

interface ArchitectureDiagramProps {
  customNotes?: string;
}

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({ customNotes }) => {
  return (
    <div 
      id="architecture-diagram-container" 
      className="p-6 md:p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800"
    >
      <div className="flex flex-col items-center max-w-2xl mx-auto text-center space-y-4">
        {/* Tier 1: Public Users & Residents */}
        <div 
          id="arch-tier-clients"
          className="w-full max-w-sm p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center gap-3 text-zinc-900 dark:text-zinc-100"
        >
          <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div className="text-left">
            <div className="text-sm font-semibold">Clients & End Users</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Desktop & Mobile Browser Ingress</div>
          </div>
        </div>

        <ArrowDown className="w-5 h-5 text-zinc-400" />

        {/* Tier 2: Presentation & Application Layer */}
        <div 
          id="arch-tier-presentation"
          className="w-full max-w-md p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center gap-3 text-zinc-900 dark:text-zinc-100"
        >
          <Layout className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          <div className="text-left">
            <div className="text-sm font-semibold">Presentation & UI Application Layer</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Next.js / React 19 + TypeScript + Tailwind System</div>
          </div>
        </div>

        <ArrowDown className="w-5 h-5 text-zinc-400" />

        {/* Tier 3: Cloud Services Matrix */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auth & Gateways */}
          <div 
            id="arch-tier-auth"
            className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-3 text-zinc-900 dark:text-zinc-100"
          >
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="text-sm font-semibold">Firebase Authentication</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">RBAC Token Verification & Admin Security</div>
            </div>
          </div>

          {/* Database */}
          <div 
            id="arch-tier-database"
            className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center gap-3 text-zinc-900 dark:text-zinc-100"
          >
            <Database className="w-6 h-6 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-left">
              <div className="text-sm font-semibold">Cloud Firestore Database</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Real-time NoSQL Collections & Hardened ABAC Rules</div>
            </div>
          </div>
        </div>

        <ArrowDown className="w-5 h-5 text-zinc-400" />

        {/* Tier 4: Storage Layer */}
        <div 
          id="arch-tier-storage"
          className="w-full max-w-md p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm flex items-center justify-center gap-3 text-zinc-900 dark:text-zinc-100"
        >
          <HardDrive className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <div className="text-left">
            <div className="text-sm font-semibold">Firebase Storage & Assets Bucket</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">PDF Resumes, Project Galleries, Architecture Artifacts</div>
          </div>
        </div>
      </div>

      {customNotes && (
        <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-center">
          {customNotes}
        </div>
      )}
    </div>
  );
};
