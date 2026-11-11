import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code2, CheckCircle2, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { Service } from '../types';
import { getServices } from '../services/serviceService';
import { logAnalyticsEvent } from '../services/analyticsService';

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAnalyticsEvent({ type: 'page_view', path: '/services' });
    getServices()
      .then(setServices)
      .catch((err) => console.warn('Services fetch notice:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div id="services-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Offerings & Capabilities
        </span>
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
          Services & Technical Solutions
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
          From full-stack development and real-time database architecture to responsive UI engineering and cloud deployment, here is how I help projects achieve reliability.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-zinc-500 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading services from Cloud Firestore...</span>
        </div>
      ) : services.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-zinc-500">
          No services published yet. Add a service in the Admin dashboard!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((serv) => (
            <div
              key={serv.id}
              className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {serv.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {serv.description}
                </p>

                {/* Features checklist */}
                {serv.features && serv.features.length > 0 && (
                  <ul className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                    {serv.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  to="/contact"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Inquire About Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
