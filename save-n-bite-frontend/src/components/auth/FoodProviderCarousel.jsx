import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom' 

// Mock data for food providers
const foodProviders = [
  {
    id: 1,
    name: 'Sweet Bakery',
    image: 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    totalListings: 12,
    specialties: ['Pastries', 'Bread', 'Cakes']
  },
  {
    id: 2,
    name: 'Green Cafe',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.6,
    totalListings: 8,
    specialties: ['Vegetarian', 'Salads', 'Smoothies']
  },
  {
    id: 3,
    name: 'Artisan Bakery',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    totalListings: 15,
    specialties: ['Artisan Bread', 'Croissants', 'Sourdough']
  },
  {
    id: 4,
    name: 'Local Grocery',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.4,
    totalListings: 25,
    specialties: ['Fresh Produce', 'Pantry Items', 'Dairy']
  },
  {
    id: 5,
    name: 'Italian Corner',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.7,
    totalListings: 10,
    specialties: ['Pizza', 'Pasta', 'Italian Cuisine']
  },
  {
    id: 6,
    name: 'Lunch Spot',
    image: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    rating: 4.5,
    totalListings: 18,
    specialties: ['Sandwiches', 'Wraps', 'Salads']
  }
];

const FoodProviderCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const itemsToShow = 5;
  const maxIndex = Math.max(0, foodProviders.length - itemsToShow);

  const nextSlide = () => {
    setCurrentIndex(prev => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
  };

  useEffect(() => {
    if (!isHovered) {
      intervalRef.current = setInterval(nextSlide, 3000); 
    }

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [isHovered, currentIndex]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Shop by Food Provider
          </h2>
          <p className="text-gray-600">
            Discover your favorite local businesses and their available food
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
      </div>

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`
          }}
        >
          {foodProviders.map((provider) => (
            <div
              key={provider.id}
              className="flex-shrink-0 w-1/4 px-2"
              onMouseEnter={() => setIsHovered(true)}
            >
              <div className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
                <div className="relative">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Star size={12} className="text-yellow-400 fill-current mr-1" />
                    <span className="text-xs font-semibold text-gray-700">
                      {provider.rating}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    {provider.name}
                  </h3>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {provider.totalListings} listings available
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {provider.specialties.slice(0, 2).map((specialty, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {provider.specialties.length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        +{provider.specialties.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <button className="w-full py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-colors duration-200">
                    View Options
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentIndex
                ? 'bg-emerald-600'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

    

    </div>
  );
};

export default FoodProviderCarousel;