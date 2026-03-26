import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      onClick={() => setMobileOpen(false)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive(to) ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-3xl">🇳🇬</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Ẹ̀kọ́ Yorùbá
                </span>
              </Link>
            </div>

            {/* Desktop links */}
            <div className="hidden md:flex items-center space-x-1">
              {navLink('/', 'Home')}
              {navLink('/lessons', 'Lessons')}
              {navLink('/vocabulary', 'Vocabulary')}
              {navLink('/schedule', 'Schedule')}
              {navLink('/techniques', 'Techniques')}
              {navLink('/drill', 'Intensive Drill')}
              {navLink('/flashcards', 'Flashcards')}
              {user ? (
                <>
                  {navLink('/profile', 'Profile')}
                  <button
                    onClick={() => logout()}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                navLink('/login', 'Login')
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 px-4 py-3 space-y-1">
            {navLink('/', 'Home')}
            {navLink('/lessons', 'Lessons')}
            {navLink('/vocabulary', 'Vocabulary')}
            {navLink('/schedule', 'Schedule')}
            {navLink('/techniques', 'Techniques')}
            {navLink('/drill', 'Intensive Drill')}
            {navLink('/flashcards', 'Flashcards')}
            {user ? (
              <>
                {navLink('/profile', 'Profile')}
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              navLink('/login', 'Login')
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            Kọ́ Yorùbá nípasẹ̀ ìbánisọ̀rọ̀ • Learn Yoruba through conversation
          </p>
        </div>
      </footer>
    </div>
  );
}
