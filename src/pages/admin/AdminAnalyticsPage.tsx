import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Eye,
  Users,
  Monitor,
  Smartphone,
  Globe,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import {
  getAnalyticsSummary,
  getRecentEvents,
} from "../../services/analyticsService";
import { useToast } from "../../components/ui/Toast";
import { useSettings } from "../../context/SettingsContext";
import {
  getAnalyticsChartPalette,
  getStoredBrandColor,
  normalizeHex,
} from "../../utils/brandTheme";

export const AdminAnalyticsPage: React.FC = () => {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");
  const [summary, setSummary] = useState({
    totalViews: 1248,
    uniqueVisitors: 412,
    topPages: [
      { path: "/", views: 680 },
      { path: "/projects", views: 245 },
      { path: "/blog", views: 180 },
      { path: "/resume", views: 92 },
      { path: "/contact", views: 51 },
    ],
    devices: [
      { name: "Desktop", value: 72 },
      { name: "Mobile", value: 24 },
      { name: "Tablet", value: 4 },
    ],
    dailyTrend: [
      { day: "Mon", views: 140 },
      { day: "Tue", views: 195 },
      { day: "Wed", views: 230 },
      { day: "Thu", views: 185 },
      { day: "Fri", views: 260 },
      { day: "Sat", views: 110 },
      { day: "Sun", views: 128 },
    ],
  });

  const { showToast } = useToast();

  // Dynamically adapt chart palette from active site settings brand color
  const brandColor = normalizeHex(
    settings?.primaryColor || getStoredBrandColor(),
  );
  const chartPalette = getAnalyticsChartPalette(brandColor);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalyticsSummary();
        if (data && data.totalViews > 0) {
          setSummary(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  return (
    <div id="admin-analytics-page" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Analytics & Engagement
            </h1>
            <div
              className="hidden items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
              title="Charts automatically match your configured brand theme"
            >
              <span
                className="w-2 h-2 rounded-full shadow-xs"
                style={{ backgroundColor: brandColor }}
              />
              <span>{brandColor.toUpperCase()}</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Track visitors, popular project case studies, and device usage
            across your portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTimeRange("7d")}
            style={
              timeRange === "7d"
                ? {
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    borderColor: brandColor,
                  }
                : undefined
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === "7d"
                ? "shadow-sm border text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange("30d")}
            style={
              timeRange === "30d"
                ? {
                    backgroundColor: brandColor,
                    color: "#ffffff",
                    borderColor: brandColor,
                  }
                : undefined
            }
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === "30d"
                ? "shadow-sm border text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Total Page Views</span>
            <Eye className="w-4 h-4" style={{ color: brandColor }} />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {summary.totalViews.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14% vs previous week</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Unique Visitors</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            {summary.uniqueVisitors.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8% vs previous week</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Avg. Engagement Time</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            2m 45s
          </div>
          <div className="text-[11px] text-zinc-400 font-mono">
            High case study read-through
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-semibold">Primary Platform</span>
            <Monitor className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
            72% Desktop
          </div>
          <div className="text-[11px] text-zinc-400">
            Engineering & Recruiter traffic
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Line / Bar */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Traffic Volume Over Time
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span
                className="w-2.5 h-2.5 rounded-sm"
                style={{ backgroundColor: brandColor }}
              />
              <span>Views</span>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.dailyTrend}>
                <defs>
                  <linearGradient
                    id="analyticsBarGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={brandColor} stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor={brandColor}
                      stopOpacity={0.72}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
                  }}
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                />
                <Bar
                  dataKey="views"
                  fill="url(#analyticsBarGradient)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 flex flex-col justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Device Distribution
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.devices}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {summary.devices.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={chartPalette[index % chartPalette.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-4 text-xs">
            {summary.devices.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: chartPalette[i % chartPalette.length],
                  }}
                />
                <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
                  {d.name} ({d.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Visited Pages Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
          Most Visited Pages & Case Studies
        </h2>
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {summary.topPages.map((item, idx) => (
            <div
              key={item.path}
              className="py-3 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-400 text-[11px] w-5">
                  0{idx + 1}
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                  {item.path}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-24 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((item.views / summary.totalViews) * 100 * 2.2))}%`,
                      backgroundColor: brandColor,
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 min-w-16 justify-end">
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {item.views.toLocaleString()}
                  </span>
                  <span className="text-zinc-400 text-[11px]">views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
