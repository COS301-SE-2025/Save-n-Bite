import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LeafIcon,
  PiggyBankIcon ,
  RecycleIcon,
  ShoppingBagIcon,
  QrCodeIcon,
  UtensilsCrossedIcon,
  UsersIcon,
  SearchIcon,
  ArrowRightIcon,
  HeartHandshakeIcon,
  CheckIcon,
  MapPinIcon,
  HeartIcon,
  AppleIcon
} from 'lucide-react';
import NavBar from '../../components/auth/NavBar';
import Footer from '../../components/auth/Footer';
import { ThemeContext } from '../../context/ThemeContext';
import { HomeAPI } from '../../services/HomeAPI';

// Abstract Blob Component
const Blob = ({ className, color = 'emerald' }) => (
  <div 
    className={`absolute -z-10 aspect-square w-64 md:w-96 rounded-full filter blur-3xl opacity-70 ${className} animate-float-slow`} 
    style={{ 
      background: `radial-gradient(circle, var(--tw-gradient-stops))`, 
      '--tw-gradient-from': `var(--${color}-400)`, 
      '--tw-gradient-to': `var(--${color}-600)`, 
      '--tw-gradient-stops': `var(--tw-gradient-from), var(--tw-gradient-to)` 
    }} 
  />
);

// Animated Circle Component
const AnimatedCircle = ({ size, color, delay, className = '' }) => (
  <div 
    className={`absolute rounded-full bg-${color}-100 dark:bg-${color}-900/20 ${className}`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      animation: `pulse 8s ease-in-out infinite ${delay}s`,
    }}
  />
);

const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_users: 0, total_orders: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${num.toLocaleString()}+`;
    return `${num}`;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const res = await HomeAPI.getStats();
      if (isMounted && res.success && res.data) {
        setStats({
          total_users: res.data.total_users || 0,
          total_orders: res.data.total_orders || 0,
        });
        setStatsLoaded(true);
      } else if (isMounted) {
        setStatsLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  
  const handleGetStarted = () => {
    window.scrollTo(0, 0);
    navigate('/register');
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <NavBar />
      
      {/* 1. Hero Section */}
      <div
      id="hero"
      className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 md:py-28 px-6">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <Blob className="-top-32 -left-32 w-96 h-96" color="emerald" />
          <Blob className="-bottom-40 -right-40 w-[500px] h-[500px]" color="blue" />
          <div className="absolute inset-0 bg-grid-pattern dark:opacity-[0.02] opacity-[0.03]" />
          
          {/* Animated Circles */}
          <AnimatedCircle size="300" color="emerald" delay="0" className="top-1/4 -left-32 -translate-y-1/2" />
          <AnimatedCircle size="400" color="blue" delay="0.5" className="bottom-1/4 -right-32 translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Animated Tagline */}
            <div
  className="inline-block mb-6 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-semibold border-l-4 border-emerald-400 animate-fade-in-up"
  style={{ animationDelay: '0.2s' }}
>
  <span>Join the Food Rescue Revolution</span>
</div>

            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 leading-tight">
              <span className="relative inline-block animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <span className="relative z-10">Save More,</span>
                <span className="absolute bottom-2 left-0 w-full h-4 bg-emerald-400/30 dark:bg-emerald-500/30 -rotate-1"></span>
              </span>{' '}
              <span className="relative inline-block animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <span className="relative z-10">Waste Less</span>
                <span className="absolute -bottom-1 left-0 w-full h-3 bg-blue-400/30 dark:bg-blue-500/30 rotate-1"></span>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              Discover amazing food deals while fighting food waste. Your perfect meal is waiting to be rescued.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <Link
                to="/register"
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                Start Saving Now
                <ArrowRightIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-transparent text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-800 font-medium rounded-xl hover:bg-emerald-50/50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {(() => {
              const mealsRescued = stats.total_orders; // use total orders as proxy for meals
              const activeUsers = stats.total_users;
              const co2SavedTons = (stats.total_orders * 0.01).toFixed(1); // conservative derived metric
              const items = [
                {
                  icon: <UtensilsCrossedIcon size={20} />,
                  value: statsLoaded ? formatNumber(mealsRescued) : "15,000+",
                  label: "Meals Rescued",
                  color: "emerald",
                  delay: "0.1s",
                },
                {
                  icon: <UsersIcon size={20} />,
                  value: statsLoaded ? formatNumber(activeUsers) : "2,500+",
                  label: "Active Users",
                  color: "blue",
                  delay: "0.2s",
                },
                {
                  icon: <LeafIcon size={20} />,
                  value: statsLoaded ? `${co2SavedTons} tons` : "5 tons",
                  label: "CO₂ Saved",
                  color: "teal",
                  delay: "0.3s",
                },
              ];
              return items;
            })().map((stat, index) => (
              <div 
                key={index}
                className="group relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: stat.delay }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${stat.color}-100 dark:bg-${stat.color}-900/30 mb-3 mx-auto transition-transform group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. What is Save n Bite? */}
      <div 
      id="about"
      className="py-12 px-6 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl opacity-20 blur-xl"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 dark:bg-gray-700 p-4 rounded-xl">
                      <ShoppingBagIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Local Businesses</h4>
                    </div>
                    <div className="bg-blue-50 dark:bg-gray-700 p-4 rounded-xl">
                      <AppleIcon
                      className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Fresh Surplus</h4>
                    </div>
                    <div className="bg-teal-50 dark:bg-gray-700 p-4 rounded-xl">
                      <HeartIcon className="w-8 h-8 text-teal-600 dark:text-teal-400 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Community Impact</h4>
                    </div>
                    <div className="bg-purple-50 dark:bg-gray-700 p-4 rounded-xl">
                      <LeafIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">Sustainable Future</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                What is Save n Bite?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                Save n Bite is a revolutionary platform that connects conscious consumers with local businesses to rescue surplus food that would otherwise go to waste.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Our mission is to create a sustainable food ecosystem where everyone benefits - you get amazing food at great prices, businesses reduce waste, and together we make a positive impact on our planet.
              </p>
              {/* <Link 
                to="/about" 
                className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                Learn more about our mission
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Why Choose Save n Bite */}
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose Save n Bite?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Join thousands of users making a difference while enjoying great food at amazing prices.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <LeafIcon size={32} className="text-emerald-600 dark:text-emerald-400" />,
                title: "Reduce Food Waste",
                description: "Help prevent perfectly good food from ending up in landfills.",
                color: "emerald"
              },
              {
                icon: <PiggyBankIcon  size={32} className="text-blue-600 dark:text-blue-400" />,
                title: "Save Money",
                description: "Enjoy quality food at discounted prices from local businesses.",
                color: "blue"
              },
              {
                icon: <RecycleIcon size={32} className="text-teal-600 dark:text-teal-400" />,
                title: "Help the Planet",
                description: "Reduce CO₂ emissions and conserve resources with every purchase.",
                color: "teal"
              }
            ].map((benefit, index) => (
              <div 
                key={index}
                className="bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${benefit.color}-100 dark:bg-${benefit.color}-900/30 mb-6`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. How It Works */}
      <div 
       id="how-it-works"
      className="py-12 px-6 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Getting started with Save n Bite is quick and easy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <SearchIcon size={24} className="text-emerald-600 dark:text-emerald-400" />,
                title: "Browse Listings",
                description: "Discover nearby restaurants and grocery stores offering surplus food at discounted prices.",
                color: "emerald"
              },
              {
                icon: <ShoppingBagIcon size={24} className="text-blue-600 dark:text-blue-400" />,
                title: "Place Your Order",
                description: "Select your favorite items and complete your purchase through our secure platform.",
                color: "blue"
              },
              {
                icon: <QrCodeIcon size={24} className="text-teal-600 dark:text-teal-400" />,
                title: "Pick Up & Enjoy",
                description: "Collect your order at the scheduled time and enjoy delicious food while saving money and the planet.",
                color: "teal"
              }
            ].map((step, index) => (
              <div 
                key={index}
                className="relative bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${step.color}-100 dark:bg-${step.color}-900/30 mb-6 transition-transform group-hover:scale-110`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Making a Difference Together */}
      <div className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-600 to-blue-600 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
            <div className="relative z-10 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Making a Difference Together
              </h2>
              <p className="text-lg md:text-xl text-emerald-100 mb-10">
                Join our community of food waste warriors and be part of the solution.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {(() => {
                  const mealsRescued = stats.total_orders;
                  const activeUsers = stats.total_users;
                  const co2SavedTons = (stats.total_orders * 0.01).toFixed(1);
                  const items = [
                    { value: statsLoaded ? formatNumber(mealsRescued) : "15,000+", label: "Meals Rescued" },
                    { value: statsLoaded ? formatNumber(activeUsers) : "2,500+", label: "Active Users" },
                    { value: statsLoaded ? `${co2SavedTons} tons` : "5 tons", label: "CO₂ Saved" },
                  ];
                  return items;
                })().map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div className="text-emerald-100">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl max-w-2xl mx-auto">
                <div className="flex items-start">
                  <div className="bg-emerald-500/20 p-3 rounded-lg mr-4">
                    <HeartIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <blockquote className="text-emerald-100 italic mb-4">
                      "Save n Bite has changed how I think about food shopping. I'm saving money while helping local businesses reduce waste. Win-win!"
                    </blockquote>
                    <div className="font-semibold">— Capleton, Regular User</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Ready to Join */}
      <div className="py-16 px-6 bg-gray-50 dark:bg-gray-800/30">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <HeartHandshakeIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to join the movement?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Sign up today and start making a positive impact with every meal.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRightIcon className="w-5 h-5" />
              </button>
              {/* <Link
                to="/about"
                className="px-8 py-4 bg-transparent text-emerald-700 dark:text-emerald-300 border-2 border-emerald-200 dark:border-emerald-800 font-medium rounded-xl hover:bg-emerald-50/50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                Learn More
              </Link> */}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;
