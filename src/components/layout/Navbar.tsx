import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sun,
  Moon,
  Laptop,
  Menu,
  X,
  Shield,
  ChevronDown,
  User,
  FolderGit2,
  Sparkles,
  BookOpen,
  FileText,
  Mail,
  MousePointer2,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { useCursor } from "../../context/CursorContext";
import { BrandLogo } from "../ui/BrandLogo";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { toggleTheme, effectiveTheme } = useTheme();
  const { cursorEnabled, toggleCursor } = useCursor();
  const { settings, profile } = useSettings();
  const { user } = useAuth();

  // Primary visible navigation tabs requested by user
  const primaryNavItems = [
    { label: "Home", path: "/" },
    { label: "Skills", path: "/skills" },
    { label: "Experience", path: "/experience" },
    { label: "Education", path: "/education" },
  ];

  // Secondary tabs grouped cleanly under 'More'
  const moreNavItems = [
    {
      label: "About",
      path: "/about",
      description: "Background, journey & philosophy",
      icon: User,
    },
    {
      label: "Projects",
      path: "/projects",
      description: "Case studies & full-stack systems",
      icon: FolderGit2,
    },
    ...(settings.showServices
      ? [
          {
            label: "Services",
            path: "/services",
            description: "Engineering solutions & client services",
            icon: Sparkles,
          },
        ]
      : []),
    ...(settings.showBlog
      ? [
          {
            label: "Blog",
            path: "/blog",
            description: "Articles, architectural notes & insights",
            icon: BookOpen,
          },
        ]
      : []),
    {
      label: "Resume",
      path: "/resume",
      description: "Curriculum vitae & qualifications",
      icon: FileText,
    },
    {
      label: "Contact",
      path: "/contact",
      description: "Direct inquiry & consultation form",
      icon: Mail,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isMoreActive = moreNavItems.some((item) => isActive(item.path));

  // Detect scroll position to transition into floating capsule with minimal re-renders
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          // Smooth hysteresis: enter capsule at > 24px, expand back at < 10px
          const shouldBeScrolled =
            scrollY > 24 ? true : scrollY < 10 ? false : null;
          if (shouldBeScrolled !== null) {
            setIsScrolled((prev) =>
              prev !== shouldBeScrolled ? shouldBeScrolled : prev,
            );
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setMoreDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle outside click and Escape key for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMoreDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreDropdownOpen(false);
      }
    };

    if (moreDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreDropdownOpen]);

  return (
    <header
      id="main-navbar"
      className={`sticky top-0 z-40 w-full transform-gpu transition-[padding,background-color] duration-300 ease-out pointer-events-none ${
        isScrolled
          ? "bg-transparent border-transparent pt-3.5 px-3 sm:px-6 shadow-none"
          : "bg-zinc-50/85 dark:bg-zinc-950/85 backdrop-blur-md border-none pt-0 px-0 shadow-none"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between h-16 transform-gpu transition-[max-width,border-radius,background-color,border-color,box-shadow,padding] duration-300 ease-out pointer-events-auto will-change-[max-width,border-radius,box-shadow] ${
          isScrolled
            ? "max-w-4xl sm:max-w-5xl px-5 sm:px-7 rounded-full bg-white/75 dark:bg-zinc-900/80 backdrop-blur-md border border-white/60 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]"
            : "max-w-7xl px-4 sm:px-6 lg:px-8 rounded-none bg-transparent border-transparent shadow-none"
        }`}
      >
        {/* Brand / Logo */}
        <Link
          to="/"
          id="navbar-brand-link"
          className="flex items-center gap-3 font-bold tracking-tight text-zinc-900 dark:text-zinc-100 hover:opacity-85 transition-opacity shrink-0"
        >
          <BrandLogo
            image={profile?.profileImage || settings.logo}
            name={profile?.name || settings.siteName}
            sizeClass="w-9 h-9 rounded-xl shadow-2xs"
            textSizeClass="text-sm"
          />
          <span className="text-base sm:text-lg font-semibold tracking-tight">
            {profile?.name || settings.siteName || "Portfolio"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1 sm:gap-1.5"
          aria-label="Main Navigation"
        >
          {/* Primary visible items */}
          {primaryNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-link-${item.label.toLowerCase()}`}
                className={`text-sm font-medium transition-all duration-200 ${
                  isScrolled
                    ? "px-3.5 py-1.5 rounded-full"
                    : "px-3.5 py-1.5 rounded-lg"
                } ${
                  active
                    ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800/90 font-semibold shadow-2xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* More dropdown button & menu */}
          <div ref={dropdownRef} className="relative">
            <button
              id="nav-more-btn"
              type="button"
              onClick={() => setMoreDropdownOpen((prev) => !prev)}
              aria-expanded={moreDropdownOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-all ${
                isScrolled
                  ? "px-3.5 py-1.5 rounded-full"
                  : "px-3.5 py-1.5 rounded-lg"
              } ${
                isMoreActive || moreDropdownOpen
                  ? "text-zinc-900 dark:text-zinc-50 bg-zinc-100 dark:bg-zinc-800/90 font-semibold shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/40"
              }`}
            >
              <span>More</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  moreDropdownOpen
                    ? "rotate-180 text-zinc-900 dark:text-zinc-100"
                    : isMoreActive
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400"
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {moreDropdownOpen && (
              <div
                id="nav-more-dropdown"
                role="menu"
                className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl shadow-zinc-900/10 dark:shadow-black/70 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800/80 mb-1">
                  <span>Explore Sections</span>
                  <span className="text-[10px] lowercase font-normal text-zinc-400">
                    ({moreNavItems.length})
                  </span>
                </div>

                <div className="space-y-0.5">
                  {moreNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        id={`more-link-${item.label.toLowerCase()}`}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-xl text-sm transition-all duration-150 group ${
                          active
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 transition-colors ${
                            active
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {item.label}
                            </span>
                            {active && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Directional Custom Cursor Toggle (Desktop Only) */}
          <button
            onClick={toggleCursor}
            id="navbar-cursor-toggle"
            title={
              cursorEnabled
                ? "Directional custom cursor is ON (Click to switch to standard cursor)"
                : "Directional custom cursor is OFF (Click to enable)"
            }
            className={`hidden md:inline-flex items-center justify-center p-2 rounded-lg transition-all ${
              cursorEnabled
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 ring-1 ring-indigo-200 dark:ring-indigo-800/50"
                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            aria-label="Toggle directional custom cursor"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            id="navbar-theme-toggle"
            title={
              effectiveTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle light and dark mode"
          >
            {effectiveTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="navbar-mobile-menu-toggle"
            className="lg:hidden p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="navbar-mobile-dropdown"
          className={`lg:hidden pointer-events-auto transition-all duration-300 animate-in slide-in-from-top-2 shadow-2xl ${
            isScrolled
              ? "mt-2 mx-auto max-w-lg rounded-3xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 space-y-3"
              : "border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 pt-3 pb-6 space-y-3"
          }`}
        >
          {/* Primary items */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Primary Navigation
            </div>
            {primaryNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive(item.path)
                    ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* More items in mobile */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              More Pages
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile Theme Toggle Button */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <span className="flex items-center gap-2">
                {effectiveTheme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" />
                )}
                <span>
                  Theme:{" "}
                  {effectiveTheme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                Tap to toggle
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
