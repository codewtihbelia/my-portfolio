import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './components/ui/Toast';
import { CursorProvider } from './context/CursorContext';
import { DirectionalCursor } from './components/ui/DirectionalCursor';

// Layouts & Transitions
import { PublicLayout } from './components/layout/PublicLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { PageTransition } from './components/layout/PageTransition';

// Public Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SkillsPage } from './pages/SkillsPage';
import { ExperiencePage } from './pages/ExperiencePage';
import { EducationPage } from './pages/EducationPage';
import { ServicesPage } from './pages/ServicesPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ResumePage } from './pages/ResumePage';
import { ContactPage } from './pages/ContactPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdminProjectsPage } from './pages/admin/AdminProjectsPage';
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage';
import { AdminExperiencePage } from './pages/admin/AdminExperiencePage';
import { AdminEducationPage } from './pages/admin/AdminEducationPage';
import { AdminServicesPage } from './pages/admin/AdminServicesPage';
import { AdminBlogPage } from './pages/admin/AdminBlogPage';
import { AdminMessagesPage } from './pages/admin/AdminMessagesPage';
import { AdminResumesPage } from './pages/admin/AdminResumesPage';
import { AdminMediaPage } from './pages/admin/AdminMediaPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying administrator permissions...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/administrator/login" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

function AnimatedAppRoutes() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/administrator') || location.pathname.startsWith('/admin');

  // Admin routes bypass AnimatePresence to maintain instant, zero-latency CMS workflows
  if (isAdminRoute) {
    return (
      <Routes location={location}>
        {/* Administrator Authentication */}
        <Route path="/administrator/login" element={<AdminLoginPage />} />

        {/* Protected Administrator CMS Routes */}
        <Route path="/administrator" element={<ProtectedAdminRoute><AdminDashboardPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/profile" element={<ProtectedAdminRoute><AdminProfilePage /></ProtectedAdminRoute>} />
        <Route path="/administrator/projects" element={<ProtectedAdminRoute><AdminProjectsPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/skills" element={<ProtectedAdminRoute><AdminSkillsPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/experience" element={<ProtectedAdminRoute><AdminExperiencePage /></ProtectedAdminRoute>} />
        <Route path="/administrator/education" element={<ProtectedAdminRoute><AdminEducationPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/services" element={<ProtectedAdminRoute><AdminServicesPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/blog" element={<ProtectedAdminRoute><AdminBlogPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/messages" element={<ProtectedAdminRoute><AdminMessagesPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/resumes" element={<ProtectedAdminRoute><AdminResumesPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/media" element={<ProtectedAdminRoute><AdminMediaPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/analytics" element={<ProtectedAdminRoute><AdminAnalyticsPage /></ProtectedAdminRoute>} />
        <Route path="/administrator/settings" element={<ProtectedAdminRoute><AdminSettingsPage /></ProtectedAdminRoute>} />

        {/* Legacy /admin redirects */}
        <Route path="/admin/login" element={<Navigate to="/administrator/login" replace />} />
        <Route path="/admin" element={<Navigate to="/administrator" replace />} />
        <Route path="/admin/*" element={<Navigate to="/administrator" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Public routes wrapped in persistent PublicLayout shell with AnimatePresence
  return (
    <PublicLayout>
      <AnimatePresence mode="wait" initial={false}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/experience" element={<ExperiencePage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </PublicLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <CursorProvider>
              <DirectionalCursor />
              <BrowserRouter>
                <ScrollToTop />
                <AnimatedAppRoutes />
              </BrowserRouter>
            </CursorProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
