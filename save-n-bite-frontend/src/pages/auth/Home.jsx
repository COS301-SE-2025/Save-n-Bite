import React from 'react';
import { Link } from 'react-router-dom';
import { LeafIcon, DollarSignIcon, RecycleIcon, CheckCircleIcon } from 'lucide-react';
import NavBar from '../../components/auth/NavBar';
import Footer from '../../components/auth/Footer';
const HomePage = () => {
  return <div className="bg-white w-full">
    <NavBar/>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-blue-50 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6">
            Good for your pocket. <br className="hidden md:block" />
            <span className="text-emerald-600">Great for the planet.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our community to rescue surplus food at discounted prices while
            reducing food waste :/.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors">
              Sign Up
            </Link>
            <Link to="/login" className="px-8 py-3 bg-white text-emerald-600 font-medium rounded-md border border-emerald-600 hover:bg-emerald-50 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <LeafIcon size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reduce Food Waste</h3>
              <p className="text-gray-600">
                Help prevent perfectly good food from ending up in landfills.
              </p>
            </div>
            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                <DollarSignIcon size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Eat for Less</h3>
              <p className="text-gray-600">
                Enjoy quality food at discounted prices from local businesses.
              </p>
            </div>
            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="bg-emerald-100 p-4 rounded-full mb-4">
                <RecycleIcon size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Help the Environment
              </h3>
              <p className="text-gray-600">
                Reduce CO₂ emissions and conserve resources with every purchase.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* What is Save n Bite Section */}
      <section className="py-16 px-6 bg-gray-50" id="about">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            What is Save n Bite?
          </h2>
          <p className="text-xl text-gray-600 mb-4">
            Save n Bite connects conscious consumers with local businesses to
            rescue surplus food that would otherwise go to waste.
          </p>
          <p className="text-xl text-gray-600">
            Our platform helps you discover, purchase, and pick up discounted
            food items while making a positive environmental impact.
          </p>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="py-16 px-6" id="how-it-works">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center text-gray-800">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Food</h3>
              <p className="text-gray-600">
                Browse surplus food available from local businesses near you.
              </p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Order + Pay</h3>
              <p className="text-gray-600">
                Select items, pay securely, and get your pickup confirmation.
              </p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pickup</h3>
              <p className="text-gray-600">
                Visit the business during the pickup window and show your
                confirmation code.
              </p>
            </div>
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Impact</h3>
              <p className="text-gray-600">
                Track your contribution to reducing food waste and emissions.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Testimonial Section */}
      {/* this section needs to be integrated */}
      <section className="py-16 px-6 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">
            Making a Difference Together
          </h2>
          <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
            <p className="text-xl text-gray-600 italic mb-6">
              "Save n Bite has changed how I think about food shopping. I'm
              saving money while helping local businesses reduce waste.
              Win-win!"
            </p>
            <p className="font-semibold text-gray-800">
              — Sarah K., Regular User
            </p>
          </div>
           {/* this section needs to be integrated */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 mb-2">
                15,000+
              </span>
              <p className="text-gray-600">Meals Rescued</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 mb-2">
                2,500+
              </span>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-bold text-emerald-600 mb-2">
                5 tons
              </span>
              <p className="text-gray-600">CO₂ Saved</p>
            </div>
          </div>
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Ready to join the movement?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Sign up today and start making a positive impact with every meal.
          </p>
          <Link to="/register" className="px-8 py-3 bg-emerald-600 text-white font-medium rounded-md hover:bg-emerald-700 transition-colors">
            Get Started
          </Link>
        </div>
      </section>
      <Footer/>
    </div>;
};
export default HomePage;