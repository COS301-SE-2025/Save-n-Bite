import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LeafIcon,
  DollarSignIcon,
  RecycleIcon,
  ShoppingBagIcon,
  QrCodeIcon,
  UtensilsCrossedIcon,
  UsersIcon,
  SearchIcon,
  CreditCardIcon,
  MapPinIcon,
} from 'lucide-react';
import NavBar from '../../components/auth/NavBar';
import Footer from '../../components/auth/Footer';
import { ThemeContext } from '../../context/ThemeContext';

const HomePage = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const handleGetStarted = () => {
    window.scrollTo(0, 0);
    navigate('/register');
  };

  return (
    <div className="w-full min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <NavBar />
      {/* Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-24 px-6"
      >
        {/* Accent shapes */}
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute top-20 -right-10 w-60 h-60 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-emerald-300/40 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent dark:from-white/5" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
              <ShoppingBagIcon size={20} />
              <QrCodeIcon size={20} />
              <UtensilsCrossedIcon size={20} />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6">
              Good for your pocket. <br className="hidden md:block" />
              <span className="text-emerald-600 dark:text-emerald-400">
                Great for the planet.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              Rescue surplus food, support local, and save more—join a community
              making real impact.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors"
              >
                Get started free
              </Link>
              <Link
                to="/login"
                className="px-8 py-3 bg-transparent text-emerald-700 dark:text-emerald-300 border border-emerald-600 dark:border-emerald-400 font-medium rounded-md hover:bg-emerald-50/70 dark:hover:bg-white/5 transition-colors"
              >
                I already have an account
              </Link>
            </div>
          </div>

          {/* Metrics with icons */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur rounded-lg p-6 border border-emerald-100 dark:border-gray-700 transition-all hover:shadow-sm">
              <div className="mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
                <UtensilsCrossedIcon
                  className="text-emerald-600 dark:text-emerald-400"
                  size={20}
                />
              </div>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight group-hover:scale-[1.02] transition-transform">
                15,000+
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Meals rescued
              </div>
            </div>
            <div className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur rounded-lg p-6 border border-emerald-100 dark:border-gray-700 transition-all hover:shadow-sm">
              <div className="mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900">
                <UsersIcon
                  className="text-blue-600 dark:text-blue-400"
                  size={20}
                />
              </div>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight group-hover:scale-[1.02] transition-transform">
                2,500+
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Active users
              </div>
            </div>
            <div className="group bg-white/70 dark:bg-gray-800/60 backdrop-blur rounded-lg p-6 border border-emerald-100 dark:border-gray-700 transition-all hover:shadow-sm">
              <div className="mx-auto mb-2 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900">
                <LeafIcon
                  className="text-emerald-600 dark:text-emerald-400"
                  size={20}
                />
              </div>
              <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight group-hover:scale-[1.02] transition-transform">
                5 tons
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                CO₂ saved
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section id="about" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full mb-4">
                <LeafIcon
                  size={32}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Reduce Food Waste
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Help prevent perfectly good food from ending up in landfills.
              </p>
            </div>
            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                <DollarSignIcon
                  size={32}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Eat for Less
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enjoy quality food at discounted prices from local businesses.
              </p>
            </div>
            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-4 rounded-full mb-4">
                <RecycleIcon
                  size={32}
                  className="text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Help the Environment
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Reduce CO₂ emissions and conserve resources with every purchase.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* What is Save n Bite Section */}
      <section className="py-16 px-6 bg-gray-50 dark:bg-gray-800" id="about">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            What is Save n Bite?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            Save n Bite connects conscious consumers with local businesses to
            rescue surplus food that would otherwise go to waste.
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Our platform helps you discover, purchase, and pick up discounted
            food items while making a positive environmental impact.
          </p>
        </div>
      </section>
      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-800 dark:text-gray-100">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900">
                <SearchIcon className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Discover Food
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Browse surplus food near you from local businesses.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900">
                <CreditCardIcon className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Order + Pay
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Select items, pay securely, and get confirmation.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900">
                <MapPinIcon className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Pickup
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Visit during the pickup window and show your code.
              </p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:scale-[1.02] transition-all duration-150">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-blue-100 dark:bg-blue-900">
                <LeafIcon className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
                Impact
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Track your contribution and share the good.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonial Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800 dark:text-gray-100">
            Making a Difference Together
          </h2>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm mb-8">
            <p className="text-xl text-gray-600 dark:text-gray-300 italic mb-6">
              "Save n Bite has changed how I think about food shopping. I'm
              saving money while helping local businesses reduce waste.
              Win-win!"
            </p>
            <p className="font-semibold text-gray-800 dark:text-gray-100">
              — Jason de Bruin, Regular User
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                15,000+
              </span>
              <p className="text-gray-600 dark:text-gray-300">Meals Rescued</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                2,500+
              </span>
              <p className="text-gray-600 dark:text-gray-300">Active Users</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                5 tons
              </span>
              <p className="text-gray-600 dark:text-gray-300">CO₂ Saved</p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Ready to join the movement?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Sign up today and start making a positive impact with every meal.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
          >
            Get Started
          </button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default HomePage;
