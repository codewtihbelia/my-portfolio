import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, MapPin, ExternalLink, ArrowUp } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { SocialLink } from '../../types';
import { getSocialLinks } from '../../services/socialService';
import { BrandLogo } from '../ui/BrandLogo';

export const Footer: React.FC = () => {
  const { settings, profile } = useSettings();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    getSocialLinks(true)
      .then(setSocialLinks)
      .catch((err) => console.warn('Footer social links notice:', err));
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderSocialIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('github')) return <Github className="w-4 h-4" />;
    if (p.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
    if (p.includes('twitter') || p.includes('x')) return <Twitter className="w-4 h-4" />;
    return <ExternalLink className="w-4 h-4" />;
  };

  return (
    <footer 
      id="main-footer"
      className="w-full bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200/80 dark:border-zinc-800/80 transition-colors mt-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Identity & Short Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <BrandLogo 
                image={profile?.profileImage || settings.logo} 
                name={profile?.name || settings.siteName} 
                sizeClass="w-7 h-7 rounded-lg" 
                textSizeClass="text-xs" 
              />
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {profile?.name || settings.siteName}
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md leading-relaxed">
              {profile?.shortIntroduction || settings.siteDescription}
            </p>
            {profile?.location && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                <span>Based in {profile.location}</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li><Link to="/about" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">About</Link></li>
              <li><Link to="/projects" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Projects & Case Studies</Link></li>
              <li><Link to="/skills" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Skills & Tech Stack</Link></li>
              <li><Link to="/experience" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Career Timeline</Link></li>
              <li><Link to="/education" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Education & Credentials</Link></li>
              {settings.showServices && (
                <li><Link to="/services" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Services Offered</Link></li>
              )}
              {settings.showBlog && (
                <li><Link to="/blog" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Articles & Insights</Link></li>
              )}
              <li><Link to="/resume" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Resume</Link></li>
              <li><Link to="/contact" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Social Links & Connectivity */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Connect
            </h4>
            {profile?.email && (
              <a 
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="truncate">{profile.email}</span>
              </a>
            )}
            
            <div className="flex flex-wrap gap-2 pt-2">
              {socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  title={link.platform}
                  className="p-2 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  {renderSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar with copyright & back-to-top */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <p>{settings.copyrightText || `© ${new Date().getFullYear()} ${profile?.name || 'Developer'}. All Rights Reserved.`}</p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
