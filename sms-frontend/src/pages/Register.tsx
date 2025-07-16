import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, MessageSquare, User, Phone } from 'lucide-react';
import { register } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    username: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
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
      await register(formData);
      setIsLoading(false);
      alert('Inscription réussie ! Connectez-vous maintenant.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.non_field_errors || 'Erreur d’inscription');
      setIsLoading(false);
    }
  };

  const passwordMatch = formData.password === formData.confirmPassword;
  const isFormValid = formData.nom && formData.prenom && formData.username && 
                     formData.email && formData.telephone && formData.password && 
                     formData.confirmPassword && passwordMatch && acceptTerms;

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
            Créer un compte
          </h2>
          <p className="text-gray-600">
            Rejoignez notre plateforme SMS dès maintenant
          </p>
        </div>

        <div className="bg-white shadow-lg p-8 rounded-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="gap-4 grid grid-cols-2">
              <div>
                <label htmlFor="prenom" className="block mb-2 font-medium text-gray-700 text-sm">
                  Prénom
                </label>
                <div className="relative">
                  <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="prenom"
                    name="prenom"
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={handleChange}
                    className="block px-3 py-3 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                    placeholder="Mamadou"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nom" className="block mb-2 font-medium text-gray-700 text-sm">
                  Nom
                </label>
                <div className="relative">
                  <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="nom"
                    name="nom"
                    type="text"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    className="block px-3 py-3 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                    placeholder="Ndiaye"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block mb-2 font-medium text-gray-700 text-sm">
                Nom d’utilisateur
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
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
              <label htmlFor="email" className="block mb-2 font-medium text-gray-700 text-sm">
                Adresse email
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block px-3 py-3 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="telephone" className="block mb-2 font-medium text-gray-700 text-sm">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  className="block px-3 py-3 pl-10 border border-gray-300 focus:border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full transition-colors placeholder-gray-400"
                  placeholder="+221123456789"
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

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 font-medium text-gray-700 text-sm">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <div className="left-0 absolute inset-y-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 pr-10 block w-full border rounded-lg px-3 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    formData.confirmPassword && !passwordMatch
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="right-0 absolute inset-y-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && !passwordMatch && (
                <p className="mt-2 text-red-600 text-sm">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="border-gray-300 rounded focus:ring-emerald-500 w-4 h-4 text-emerald-600"
              />
              <label htmlFor="accept-terms" className="block ml-2 text-gray-700 text-sm">
                J'accepte les{' '}
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  conditions d’utilisation
                </a>{' '}
                et la{' '}
                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                  politique de confidentialité
                </a>
              </label>
            </div>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 w-full font-semibold text-white transition-colors disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="mr-2 border-white border-b-2 rounded-full w-5 h-5 animate-spin"></div>
                  Création du compte...
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;