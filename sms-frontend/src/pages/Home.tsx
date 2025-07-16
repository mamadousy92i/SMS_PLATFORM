import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Zap, 
  Shield, 
  BarChart3, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Send,
  Globe,
  Users,
  Clock,
  Star,
  TrendingUp,
  Award,
  ChevronDown
} from 'lucide-react';

const Home = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    
    // Animation automatique des features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);

    // Suivre la position de la souris pour l'effet parallax
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const features = [
    {
      icon: <Zap className="w-8 h-8 text-emerald-600" />,
      title: "Envoi Instantané",
      description: "Envoyez vos SMS en quelques secondes grâce à notre API ultra-rapide",
      gradient: "from-emerald-400 to-teal-500"
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Sécurisé",
      description: "Vos données sont protégées avec les dernières technologies de chiffrement",
      gradient: "from-blue-400 to-indigo-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Analyses Détaillées",
      description: "Suivez vos campagnes avec des statistiques en temps réel",
      gradient: "from-purple-400 to-pink-500"
    }
  ];

  const benefits = [
    "Interface intuitive et facile à utiliser",
    "API Orange fiable et performante",
    "Support technique 24/7",
    "Tarifs compétitifs",
    "Intégration facile"
  ];

  const stats = [
    { number: "1M+", label: "Messages envoyés", icon: Send },
    { number: "10K+", label: "Clients satisfaits", icon: Users },
    { number: "99.9%", label: "Uptime garanti", icon: TrendingUp },
    { number: "24/7", label: "Support disponible", icon: Clock }
  ];

  return (
    <>
      <div className="flex flex-col overflow-hidden">
        {/* Hero Section avec animations et effets */}
        <section className="relative bg-gradient-to-br from-emerald-50 via-white to-teal-50 pt-16 pb-32 overflow-hidden">
          {/* Arrière-plan animé */}
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="top-1/4 left-1/4 absolute bg-emerald-300 opacity-20 blur-xl rounded-full w-96 h-96 animate-blob mix-blend-multiply filter"
              style={{
                transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`
              }}
            ></div>
            <div 
              className="top-1/3 right-1/4 absolute bg-teal-300 opacity-20 blur-xl rounded-full w-96 h-96 animate-blob animation-delay-2000 mix-blend-multiply filter"
              style={{
                transform: `translate(${mousePosition.x * -0.1}px, ${mousePosition.y * 0.05}px)`
              }}
            ></div>
            <div 
              className="bottom-1/4 left-1/3 absolute bg-blue-300 opacity-20 blur-xl rounded-full w-96 h-96 animate-blob animation-delay-4000 mix-blend-multiply filter"
              style={{
                transform: `translate(${mousePosition.x * 0.05}px, ${mousePosition.y * -0.1}px)`
              }}
            ></div>
          </div>

          {/* Particules flottantes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-float-${i % 3 + 1}`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>

          <div className="z-10 relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="text-center">
              {/* Titre principal avec animation */}
              <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                <div className="inline-flex items-center space-x-2 bg-emerald-100 mb-6 px-4 py-2 rounded-full font-medium text-emerald-800 text-sm animate-pulse-soft">
                  <Sparkles className="w-4 h-4" />
                  <span>Plateforme SMS nouvelle génération</span>
                </div>
                
                <h1 className="mb-6 font-bold text-gray-900 text-5xl md:text-7xl leading-tight">
                  Envoyez vos SMS en toute
                  <span className="block bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-transparent animate-gradient-x">
                    simplicité
                  </span>
                </h1>
              </div>

              {/* Sous-titre avec animation décalée */}
              <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                <p className="mx-auto mb-8 max-w-4xl text-gray-600 text-xl md:text-2xl leading-relaxed">
                  Plateforme professionnelle d'envoi de SMS via l'API Orange. 
                  Communiquez efficacement avec vos clients grâce à notre solution 
                  <span className="font-semibold text-emerald-600"> robuste et intuitive</span>.
                </p>
              </div>

              {/* Boutons avec animations */}
              <div className={`transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                <div className="flex sm:flex-row flex-col justify-center gap-4 mb-12">
                  <Link
                    to="/register"
                    className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-2xl hover:shadow-emerald-500/25 px-8 py-4 rounded-xl overflow-hidden font-semibold text-white text-lg hover:scale-105 transition-all duration-300 transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 transform"></div>
                    <span className="relative flex justify-center items-center">
                      Commencer gratuitement
                      <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                  <Link
                    to="/login"
                    className="group hover:bg-emerald-600 px-8 py-4 border-2 border-emerald-600 rounded-xl font-semibold text-emerald-600 hover:text-white text-lg hover:scale-105 transition-all duration-300 transform"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>

              {/* Statistiques animées */}
              <div className={`transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}>
                <div className="gap-8 grid grid-cols-2 md:grid-cols-4 mx-auto max-w-4xl">
                  {stats.map((stat, index) => (
                    <div 
                      key={index}
                      className="group text-center hover:scale-110 transition-all duration-300 transform"
                      style={{ animationDelay: `${index * 200}ms` }}
                    >
                      <div className="inline-flex justify-center items-center bg-emerald-100 group-hover:bg-emerald-200 mb-3 rounded-xl w-12 h-12 transition-colors">
                        <stat.icon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="font-bold text-gray-900 text-3xl animate-count-up">{stat.number}</div>
                      <div className="text-gray-600 text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="bottom-8 left-1/2 absolute -translate-x-1/2 animate-bounce transform">
            <ChevronDown className="w-6 h-6 text-emerald-600" />
          </div>
        </section>

        {/* Features Section avec animations au scroll */}
        <section className="relative bg-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="z-10 relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="mb-20 text-center">
              <h2 className="mb-6 font-bold text-gray-900 text-4xl md:text-5xl">
                Pourquoi choisir notre 
                <span className="bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 text-transparent"> plateforme</span> ?
              </h2>
              <p className="mx-auto max-w-3xl text-gray-600 text-xl">
                Découvrez les avantages qui font de notre solution le choix idéal pour vos communications SMS
              </p>
            </div>

            <div className="gap-8 grid grid-cols-1 md:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group relative p-8 rounded-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 cursor-pointer ${
                    activeFeature === index 
                      ? 'bg-gradient-to-br from-white to-emerald-50 shadow-2xl shadow-emerald-500/20 border border-emerald-200' 
                      : 'bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 -skew-x-12 group-hover:animate-shine transform"></div>
                  
                  <div className="z-10 relative">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300 ${
                      activeFeature === index 
                        ? `bg-gradient-to-r ${feature.gradient} shadow-lg` 
                        : 'bg-gray-100 group-hover:bg-gradient-to-r group-hover:' + feature.gradient
                    }`}>
                      <div className={activeFeature === index ? 'text-white' : 'text-gray-600 group-hover:text-white'}>
                        {feature.icon}
                      </div>
                    </div>
                    
                    <h3 className="mb-4 font-semibold text-gray-900 group-hover:text-emerald-600 text-xl transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Indicateur actif */}
                  {activeFeature === index && (
                    <div className="top-0 right-0 absolute bg-emerald-500 m-4 rounded-full w-3 h-3 animate-ping"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section avec design immersif */}
        <section className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-blue-900 py-24 overflow-hidden">
          {/* Effets de fond */}
          <div className="absolute inset-0">
            <div className="top-0 left-1/4 absolute bg-emerald-500 opacity-10 blur-3xl rounded-full w-96 h-96 animate-pulse-slow mix-blend-multiply filter"></div>
            <div className="right-1/4 bottom-0 absolute bg-teal-500 opacity-10 blur-3xl rounded-full w-96 h-96 animate-pulse-slow animation-delay-2000 mix-blend-multiply filter"></div>
          </div>

          <div className="z-10 relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="items-center gap-16 grid grid-cols-1 lg:grid-cols-2">
              <div>
                <h2 className="mb-8 font-bold text-white text-4xl md:text-5xl">
                  Une solution 
                  <span className="bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-transparent"> complète</span>
                  <br />pour vos besoins
                </h2>
                <p className="mb-8 text-emerald-100 text-xl leading-relaxed">
                  Notre plateforme vous offre tous les outils nécessaires pour gérer efficacement 
                  vos campagnes SMS et optimiser votre communication client.
                </p>
                
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="group flex items-center"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex flex-shrink-0 justify-center items-center bg-emerald-500 mr-4 rounded-full w-8 h-8 group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-emerald-100 group-hover:text-white transition-colors">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card flottante avec animations */}
              <div className="relative">
                <div className="bg-white/10 shadow-2xl backdrop-blur-lg p-8 border border-white/20 rounded-3xl hover:scale-105 transition-all duration-500 transform">
                  <div className="text-center">
                    <div className="inline-flex justify-center items-center bg-gradient-to-r from-emerald-400 to-teal-400 mb-6 rounded-2xl w-20 h-20 animate-float-1">
                      <MessageSquare className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="mb-4 font-bold text-white text-2xl">
                      Prêt à commencer ?
                    </h3>
                    <p className="mb-8 text-emerald-100">
                      Rejoignez des milliers d'entreprises qui font confiance à notre plateforme
                    </p>
                    <Link
                      to="/register"
                      className="group inline-flex items-center bg-gradient-to-r from-emerald-500 hover:from-emerald-600 to-teal-500 hover:to-teal-600 px-8 py-4 rounded-xl font-semibold text-white hover:scale-105 transition-all duration-300 transform"
                    >
                      Créer mon compte
                      <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>

                {/* Éléments décoratifs */}
                <div className="-top-4 -right-4 absolute bg-emerald-400 opacity-60 rounded-full w-8 h-8 animate-ping"></div>
                <div className="-bottom-4 -left-4 absolute bg-teal-400 opacity-60 rounded-full w-6 h-6 animate-ping animation-delay-1000"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final avec effet wow */}
        <section className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <Star
                key={i}
                className="absolute text-white/20 animate-twinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  fontSize: `${Math.random() * 10 + 5}px`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
          
          <div className="z-10 relative mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
            <h2 className="mb-6 font-bold text-white text-4xl md:text-5xl">
              Commencez dès aujourd'hui
            </h2>
            <p className="mx-auto mb-10 max-w-3xl text-emerald-100 text-xl">
              Profitez de notre offre d'essai gratuite et découvrez la puissance de notre plateforme SMS
            </p>
            <Link
              to="/register"
              className="group inline-flex items-center bg-white hover:bg-gray-100 shadow-2xl px-10 py-5 rounded-xl font-semibold text-emerald-600 text-lg hover:scale-105 transition-all duration-300 transform"
            >
              <Award className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
              Essai gratuit
              <ArrowRight className="ml-3 w-6 h-6 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes gradient-x {
          0%, 100% { background-size: 200% 200%; background-position: left center; }
          50% { background-size: 200% 200%; background-position: right center; }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-25px); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        
        @keyframes count-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        .animate-blob { animation: blob 7s infinite; }
        .animate-gradient-x { animation: gradient-x 3s ease infinite; }
        .animate-float-1 { animation: float-1 3s ease-in-out infinite; }
        .animate-float-2 { animation: float-2 3s ease-in-out infinite; }
        .animate-float-3 { animation: float-3 3s ease-in-out infinite; }
        .animate-shine { animation: shine 1.5s ease-in-out; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-count-up { animation: count-up 0.6s ease-out; }
        .animate-twinkle { animation: twinkle 2s ease-in-out infinite; }
        
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-1000 { animation-delay: 1s; }
        
        .bg-grid-pattern {
          background-image: radial-gradient(circle, #e5e7eb 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
};

export default Home;