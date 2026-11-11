import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { useAuth, getAdminEnvCredentials } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { useToast } from '../../components/ui/Toast';
import { seedDatabaseIfEmpty } from '../../services/seedService';
import { Spinner } from '../../components/ui/Spinner';

export const AdminLoginPage: React.FC = () => {
  const { envUsername } = getAdminEnvCredentials();
  const [username, setUsername] = useState(envUsername || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [seeding, setSeeding] = useState(false);

  const { user, login } = useAuth();
  const { profile } = useSettings();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // If already authenticated as admin, navigate directly to /administrator
  useEffect(() => {
    if (user) {
      navigate('/administrator', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(username.trim(), password.trim());
      showToast('Welcome back, Administrator!', 'success');
      navigate('/administrator', { replace: true });
    } catch (err: any) {
      console.warn('Auth error:', err);
      setErrorMsg(err.message || 'Invalid administrator username or password. Please verify the credentials defined in your .env file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const seeded = await seedDatabaseIfEmpty();
      if (seeded) {
        showToast('Sample portfolio records initialized successfully in Firestore!', 'success');
      } else {
        showToast('Firestore already contains data records.', 'info');
      }
    } catch (err: any) {
      showToast('Error seeding database: ' + err.message, 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div id="admin-login-page" className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Portfolio</span>
        </Link>

        {/* Login Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center mx-auto shadow-sm border border-zinc-200/60 dark:border-zinc-700">
              <BrandLogo 
                image={profile?.profileImage} 
                name={profile?.name || 'Admin'} 
                sizeClass="w-full h-full"
                textSizeClass="text-lg"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Administrator Portal
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Restricted management console. Authentication is strictly controlled.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Direct Credential Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Administrator Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  id="admin-username-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  id="admin-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="admin-login-submit-btn"
              className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-colors shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-3.5 h-3.5" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
