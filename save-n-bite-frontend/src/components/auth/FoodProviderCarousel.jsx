import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom' 

// Mock data for food providers - duplicated for seamless loop
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
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentTransform, setCurrentTransform] = useState(0);
  const scrollRef = useRef(null);
  
  // Duplicate the array for seamless infinite scroll
  const duplicatedProviders = [...foodProviders, ...foodProviders];

  const handleMouseEnter = () => {
    if (scrollRef.current) {
      const computedStyle = window.getComputedStyle(scrollRef.current);
      const transform = computedStyle.getPropertyValue('transform');
      const matrix = new DOMMatrix(transform);
      const translateX = matrix.m41;
      setCurrentTransform(translateX);
      scrollRef.current.style.transform = `translateX(${translateX}px)`;
      scrollRef.current.style.animationPlayState = 'paused';
    }
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (!isDragging && scrollRef.current) {
      scrollRef.current.style.animationPlayState = 'running';
      setIsPaused(false);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!isPaused) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(currentTransform);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isPaused) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1; // Adjust sensitivity
    const newTransform = scrollLeft + walk;
    setCurrentTransform(newTransform);
    scrollRef.current.style.transform = `translateX(${newTransform}px)`;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (!isPaused) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(currentTransform);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isPaused) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    const newTransform = scrollLeft + walk;
    setCurrentTransform(newTransform);
    scrollRef.current.style.transform = `translateX(${newTransform}px)`;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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
      </div>

      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          className="flex animate-scroll-left select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: `${duplicatedProviders.length * 280}px`,
            cursor: isPaused ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          {duplicatedProviders.map((provider, index) => (
            <div
              key={`${provider.id}-${index}`}
              className="flex-shrink-0 w-64 px-3"
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
                    {provider.specialties.slice(0, 2).map((specialty, specIndex) => (
                      <span
                        key={specIndex}
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

      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${foodProviders.length * 280}px);
          }
        }
        
        .animate-scroll-left {
          animation: scroll-left 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default FoodProviderCarousel;