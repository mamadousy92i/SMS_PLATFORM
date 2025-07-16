import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';
import { login } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await login(formData);
      localStorage.setItem('token', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur de connexion');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center bg-gradient-to-br from-emerald-50 to-white px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="space-y-8 w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-100 p-3 rounded-full">
              <MessageSquare className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="mb-2 font-bold text-gray-900 text-3xl">
            Connexion
          </h2>
          <p className="text-gray-600">
            Accédez à votre tableau de bord SMS
          </p>
        </div>

        <div className="bg-white shadow-lg p-8 rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block mb-2 font-medium text-gray-700 text-sm">
                Nom d’utilisateur
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="block px-3 py-3 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                  placeholder="votre_nom_utilisateur"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 font-medium text-gray-700 text-sm">
                Mot de passe
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block px-3 py-3 pr-10 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="right-0 absolute inset-y-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="border-gray-300 rounded focus:ring-emerald-500 w-4 h-4 text-emerald-600"
                />
                <label htmlFor="remember-me" className="block ml-2 text-gray-700 text-sm">
                  Se souvenir de moi
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="mr-2 border-white border-b-2 rounded-full w-5 h-5 animate-spin"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Pas encore de compte ?{' '}
              <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;