'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Bell,
  User,
  Menu,
  X,
  Moon,
  Sun,
  Settings,
  LogOut,
  UserCircle
} from 'lucide-react';
import { useTheme } from '../ThemeProvider';
import { logout, getToken } from '../../services/authApi';
import { useRouter } from 'next/navigation';
import { LanguageToggle } from '../ui/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

function parseJwt(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const profileMenuRef = useRef(null);
  const router = useRouter();

  const { t } = useLanguage();

  // Get user info from token
  const token = getToken();
  const userPayload = parseJwt(token);
  
  // Display full_name if available, otherwise fall back to email
  const displayName = userPayload?.full_name || userPayload?.sub || 'User';

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
          profileMenuRef.current &&
          !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    setIsMenuOpen(false);
    router.push('/sign-in');
  };

  return (
      <header className="bg-white dark:bg-black shadow-sm sticky top-0 z-50 transition-colors duration-300">
        <div className="px-14 mx-auto relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                  src={theme === 'dark' ? '/LogoWhite.png' : '/logo2.png'}
                  alt={t.logoAlt}
                  width={110}
                  height={100}
                  className="mr-3"
              />
            </Link>

            {/* Desktop nav - Absolutely Centered */}
            <nav className="hidden md:flex space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link
                  href="/"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t.nav.projects}
              </Link>
              <Link
                  href="/vault"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t.nav.vault}
              </Link>
              <Link
                  href="/templates"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t.nav.templates}
              </Link>
              <Link
                  href="/chatbot"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t.nav.chatbot}
              </Link>
            
              <Link
                  href="/tabular"
                  className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {t.nav.tabular}
              </Link>
            </nav>

            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Search size={20} />
              </button>

              <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={
                    theme === 'light'
                        ? 'Switch to dark mode'
                        : 'Switch to light mode'
                  }
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 relative transition-colors">
                <Bell size={20} />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900"></span>
              </button>

              {/* Language */}
              <LanguageToggle />

              {/* Profile */}
              <div className="relative" ref={profileMenuRef}>
                <button
                    onClick={() => setIsProfileMenuOpen((o) => !o)}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <User size={16} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                </button>
                {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {displayName}
                        </p>
                        {userPayload?.user_type && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {userPayload.user_type}
                          </p>
                        )}
                      </div>
                      <Link
                          href="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <UserCircle size={16} className="mr-3" />
                        {t.nav.profile}
                      </Link>
                      <Link
                          href="/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings size={16} className="mr-3" />
                        {t.nav.settings}
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                      <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <LogOut size={16} className="mr-3" />
                        {t.nav.logout}
                      </button>
                    </div>
                )}
              </div>
            </div>

            {/* Mobile toggles */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                  onClick={toggleTheme}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                  onClick={() => setIsMenuOpen((o) => !o)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
            <div className="md:hidden bg-white dark:bg-gray-900 pt-2 pb-3 border-t border-gray-200 dark:border-gray-700 transition-colors">
              <div className="px-2 space-y-1">
                <Link
                    href="/vault"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.vault}
                </Link>
                <Link
                    href="/templates"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.templates}
                </Link>
                <Link
                    href="/chatbot"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.chatbot}
                </Link>
               
                <Link
                    href="/tabular"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.tabular}
                </Link>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {displayName}
                  </p>
                  {userPayload?.user_type && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {userPayload.user_type}
                    </p>
                  )}
                </div>
                <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.profile}
                </Link>
                <Link
                    href="/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {t.nav.settings}
                </Link>
                <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.nav.logout}
                </button>
              </div>
            </div>
        )}
      </header>
  );
}
