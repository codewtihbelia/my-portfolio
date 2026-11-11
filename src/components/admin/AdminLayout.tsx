import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  FolderGit2,
  Code2,
  Briefcase,
  GraduationCap,
  Layers,
  BookOpen,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Settings as SettingsIcon,
  BarChart3,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldAlert,
  Sun,
  Moon,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useTheme } from "../../context/ThemeContext";
import { DropdownMenu } from "../ui/DropdownMenu";
import { BrandLogo } from "../ui/BrandLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { profile } = useSettings();
  const { toggleTheme, effectiveTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinks = [
    { label: "Overview", path: "/administrator", icon: LayoutDashboard },
    { label: "Profile", path: "/administrator/profile", icon: User },
    { label: "Projects", path: "/administrator/projects", icon: FolderGit2 },
    { label: "Skills", path: "/administrator/skills", icon: Code2 },
    { label: "Experience", path: "/administrator/experience", icon: Briefcase },
    {
      label: "Education & Certs",
      path: "/administrator/education",
      icon: GraduationCap,
    },
    { label: "Services", path: "/administrator/services", icon: Layers },
    { label: "Blog Posts", path: "/administrator/blog", icon: BookOpen },
    { label: "Messages", path: "/administrator/messages", icon: MessageSquare },
    { label: "Resumes", path: "/administrator/resumes", icon: FileText },
    { label: "Media Library", path: "/administrator/media", icon: ImageIcon },
    { label: "Analytics", path: "/administrator/analytics", icon: BarChart3 },
    {
      label: "Site Settings",
      path: "/administrator/settings",
      icon: SettingsIcon,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/administrator")
      return location.pathname === "/administrator";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      id="admin-layout"
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row"
    >
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 font-bold text-sm">
          <BrandLogo
            image={profile?.profileImage}
            name={profile?.name || "CMS"}
            sizeClass="w-7 h-7 rounded-lg"
            textSizeClass="text-xs"
          />
          <span className="truncate max-w-37.5">
            {profile?.name || "Portfolio Admin"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            title={
              effectiveTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {effectiveTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Brand header */}
          <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <Link
              to="/administrator"
              className="flex items-center gap-2.5 font-bold tracking-tight"
            >
              <BrandLogo
                image={profile?.profileImage}
                name={profile?.name || "CMS"}
                sizeClass="w-8 h-8 rounded-lg"
                textSizeClass="text-xs"
              />
              <div className="text-left min-w-0">
                <div className="text-sm font-bold truncate max-w-35">
                  {profile?.name || "Admin Console"}
                </div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                  belia.dev
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation links */}
          <nav className="p-3 space-y-1 flex-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom user status & links */}
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between gap-1">
              <Link
                to="/"
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>View Public Portfolio</span>
              </Link>
              <button
                onClick={toggleTheme}
                title={
                  effectiveTheme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {effectiveTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                )}
              </button>
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <DropdownMenu
                align="left"
                widthClass="w-56"
                containerClassName="w-full"
                trigger={(isOpen) => (
                  <div
                    className={`w-full flex items-center justify-between p-1.5 rounded-xl transition-colors cursor-pointer ${
                      isOpen
                        ? "bg-zinc-100 dark:bg-zinc-800"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-8 h-8 rounded-xl overflow-hidden bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-indigo-500/20">
                        {profile?.profileImage ? (
                          <img
                            src={profile.profileImage}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          user?.email?.charAt(0).toUpperCase() || "A"
                        )}
                      </div>
                      <div className="truncate text-left">
                        <div className="text-xs font-semibold truncate text-zinc-900 dark:text-zinc-100">
                          {user?.email || "Admin"}
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {isAdmin ? "Super Admin" : "Admin Role"}
                        </div>
                      </div>
                    </div>
                    <ChevronUp
                      className={`hidden w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`}
                    />
                  </div>
                )}
                items={[
                  {
                    label: "Admin Profile",
                    icon: User,
                    to: "/administrator/profile",
                  },
                  {
                    label: "Site Settings",
                    icon: SettingsIcon,
                    to: "/administrator/settings",
                  },
                  {
                    label: "Public Portfolio",
                    icon: ExternalLink,
                    to: "/",
                  },
                  { separator: true },
                  {
                    label: "Sign Out",
                    icon: LogOut,
                    onClick: handleLogout,
                    danger: true,
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
