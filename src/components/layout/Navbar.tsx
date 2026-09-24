'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { GurukulLogo } from '@/components/ui/GurukulLogo';
import { navigationLinks } from '@/data/landingData';
import { ProgramsMegaMenu } from './ProgramsMegaMenu';
import { SearchOverlay } from './SearchOverlay';
import { Menu, X, ChevronDown, ArrowRight, Search, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  variant?: 'light' | 'dark';
}

interface CurrentUser {
  name: string;
  role: 'student' | 'admin';
}

export const Navbar: React.FC<NavbarProps> = ({ variant = 'light' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileProgramsOpen, setMobileProgramsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [programsMenuOpen, setProgramsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined); // undefined = still checking
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = variant === 'dark';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const body = await res.json();
        if (!cancelled) setUser(body.success ? { name: body.user.name, role: body.user.role } : null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
    // Re-check whenever the route changes (e.g. right after login/logout redirects).
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAccountMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const dashboardHref = user?.role === 'admin' ? '/admin' : '/courses/data-science/documents';

  const openPrograms = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setProgramsMenuOpen(true);
  };

  const scheduleClosePrograms = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setProgramsMenuOpen(false), 200);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isDark
          ? 'bg-gurukul-navy-950/95 border-b border-gurukul-navy-cardBorder text-white backdrop-blur-md'
          : scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 text-slate-900'
          : 'bg-white border-b border-slate-100 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-5 xl:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <GurukulLogo variant={isDark ? 'dark' : 'light'} />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2.5 xl:gap-6 whitespace-nowrap">
            {navigationLinks.map((link) => {
              if (link.label === 'Programs') {
                return (
                  <div
                    key={link.label}
                    className="relative"
                    onMouseEnter={openPrograms}
                    onMouseLeave={scheduleClosePrograms}
                  >
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={programsMenuOpen}
                      onClick={() => setProgramsMenuOpen((v) => !v)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        isDark ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-red-700'
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                          programsMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                );
              }

              if (link.children) {
                return (
                  <div
                    key={link.label}
                    className="relative group"
                    onMouseEnter={() => setResourcesOpen(true)}
                    onMouseLeave={() => setResourcesOpen(false)}
                  >
                    <button
                      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                        isDark
                          ? 'text-slate-200 hover:text-white'
                          : 'text-slate-700 hover:text-red-700'
                      }`}
                      onClick={() => setResourcesOpen(!resourcesOpen)}
                    >
                      {link.label}
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-transform duration-200 group-hover:rotate-180" />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute top-full left-0 w-64 pt-2 transition-all duration-200 ${
                        resourcesOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                      }`}
                    >
                      <div
                        className={`rounded-xl shadow-xl border p-2 ${
                          isDark
                            ? 'bg-gurukul-navy-card border-gurukul-navy-cardBorder text-white'
                            : 'bg-white border-slate-100 text-slate-900'
                        }`}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className={`block p-2.5 rounded-lg transition-colors ${
                              isDark
                                ? 'hover:bg-slate-800/60'
                                : 'hover:bg-red-50'
                            }`}
                          >
                            <div className="text-sm font-semibold">{child.label}</div>
                            {child.description && (
                              <div className="text-xs text-slate-400 mt-0.5">{child.description}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? isDark
                        ? 'text-red-400 font-semibold'
                        : 'text-red-700 font-semibold'
                      : isDark
                      ? 'text-slate-200 hover:text-white'
                      : 'text-slate-700 hover:text-red-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            {/* Persistent search pill (xl+), icon-only trigger below xl */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`hidden xl:flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-colors ${
                isDark
                  ? 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-500 hover:border-red-300 hover:bg-red-50/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="whitespace-nowrap">What do you want to learn?</span>
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`xl:hidden p-2 rounded-full transition-colors ${
                isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 hover:text-red-700'
              }`}
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div
                className="relative"
                onMouseEnter={() => setAccountMenuOpen(true)}
                onMouseLeave={() => setAccountMenuOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-all duration-200 ${
                    isDark
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                      : 'border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-700 hover:bg-red-50/50'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className={`absolute top-full right-0 w-56 pt-2 transition-all duration-200 ${
                    accountMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                >
                  <div className="rounded-xl shadow-xl border border-slate-100 bg-white text-slate-900 p-2">
                    <Link
                      href={dashboardHref}
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 p-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {user.role === 'admin' ? 'Admin Dashboard' : 'My Courses'}
                    </Link>
                    {user.role === 'student' && (
                      <Link
                        href="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2 p-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        My Performance
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
            ) : user === null ? (
              <Link
                href="/login"
                className={`px-5 py-2 text-sm font-semibold rounded-full border transition-all duration-200 ${
                  isDark
                    ? 'border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white'
                    : 'border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-700 hover:bg-red-50/50'
                }`}
              >
                Login
              </Link>
            ) : (
              <div className="w-20 h-9" aria-hidden="true" />
            )}

            <Link
              href="/programs/data-science"
              className="inline-flex items-center gap-1.5 px-3.5 lg:px-5 xl:px-6 py-2.5 text-xs lg:text-sm font-bold text-white rounded-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 shadow-md hover:shadow-red-500/25 transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap flex-shrink-0"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Buttons */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className={`p-2 rounded-lg ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Programs Mega Menu */}
      <div onMouseEnter={openPrograms} onMouseLeave={scheduleClosePrograms}>
        <ProgramsMegaMenu
          open={programsMenuOpen}
          onClose={() => setProgramsMenuOpen(false)}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </div>

      {/* Global Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Responsive Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className={`md:hidden border-b px-4 pt-2 pb-6 space-y-3 transition-all ${
            isDark
              ? 'bg-gurukul-navy-card border-gurukul-navy-cardBorder text-white'
              : 'bg-white border-slate-200 text-slate-900 shadow-lg'
          }`}
        >
          <div className="flex flex-col space-y-2 pt-2">
            {navigationLinks.map((link) => {
              if (link.label === 'Programs') {
                return (
                  <div key={link.label}>
                    <button
                      type="button"
                      onClick={() => setMobileProgramsOpen((v) => !v)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium transition-colors ${
                        isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileProgramsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileProgramsOpen && (
                      <div className="pl-3 pt-1 pb-2 space-y-1">
                        <Link
                          href="/programs/data-science"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-md text-sm font-semibold text-red-700 bg-red-50"
                        >
                          Data Science Championship Program™
                        </Link>
                        <Link
                          href="/programs"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-md text-xs font-semibold text-slate-500"
                        >
                          Explore all →
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              if (link.children) return null;

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isDark
                      ? 'text-slate-200 hover:bg-slate-800'
                      : 'text-slate-700 hover:bg-red-50 hover:text-red-700'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full py-2.5 text-center text-sm font-semibold rounded-lg border ${
                    isDark ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-700'
                  }`}
                >
                  {user.role === 'admin' ? 'Admin Dashboard' : 'My Courses'}
                </Link>
                {user.role === 'student' && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full py-2.5 text-center text-sm font-semibold rounded-lg border ${
                      isDark ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-700'
                    }`}
                  >
                    My Performance
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold rounded-lg border border-red-200 text-red-700"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full py-2.5 text-center text-sm font-semibold rounded-lg border ${
                  isDark ? 'border-slate-700 text-white' : 'border-slate-300 text-slate-700'
                }`}
              >
                Login
              </Link>
            )}
            <Link
              href="/programs/data-science"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 text-center text-sm font-bold text-white rounded-lg bg-gradient-to-r from-red-700 to-red-800 shadow-md flex items-center justify-center gap-2"
            >
              <span>Enroll Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
