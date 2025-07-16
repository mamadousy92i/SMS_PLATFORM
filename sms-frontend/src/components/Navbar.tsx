import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Menu, X, LogOut, LayoutDashboard, MessageCircle } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav className="top-0 z-50 sticky bg-white shadow-lg">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-emerald-600">
              <MessageSquare className="w-8 h-8" />
              <span className="font-bold text-xl">SMS Platform</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              Accueil
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <LayoutDashboard className="mr-2 w-4 h-4" />
                  Tableau de bord
                </Link>
                <Link
                  to="/channels"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/channels') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <MessageCircle className="mr-2 w-4 h-4" />
                  Channels
                </Link>
              </>
            )}
            
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-md font-medium text-white text-sm transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center hover:bg-emerald-50 px-3 py-2 rounded-md font-medium text-gray-700 hover:text-emerald-600 text-sm transition-colors"
              >
                <LogOut className="mr-1 w-5 h-5" />
                Déconnexion
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="focus:outline-none text-gray-700 hover:text-emerald-600 focus:text-emerald-600"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 bg-white px-2 sm:px-3 pt-2 pb-3 border-t">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/') 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Accueil
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="mr-2 w-4 h-4" />
                  Tableau de bord
                </Link>
                <Link
                  to="/channels"
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/channels') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="mr-2 w-4 h-4" />
                  Channels
                </Link>
              </>
            )}
            
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/login') 
                      ? 'text-emerald-600 bg-emerald-50' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="block bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-md font-medium text-white text-base transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center hover:bg-emerald-50 px-3 py-2 rounded-md w-full font-medium text-gray-700 hover:text-emerald-600 text-base transition-colors"
              >
                <LogOut className="inline mr-1 w-5 h-5" />
                Déconnexion
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;