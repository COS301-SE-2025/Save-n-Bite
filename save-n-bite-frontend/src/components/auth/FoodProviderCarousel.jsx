import React, { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import FoodProvidersAPI from '../../services/FoodProvidersAPI';

const FoodProviderCarousel = () => {
  const [foodProviders, setFoodProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [currentTransform, setCurrentTransform] = useState(0);
  const scrollRef = useRef(null);

  // Load providers from API
  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        const result = await FoodProvidersAPI.getCompleteProviders();
        
        if (result.success && result.data?.providers) {
          setFoodProviders(result.data.providers);
          setError(null);
        } else {
          setError(result.error || 'Failed to load providers');
        }
      } catch (err) {
        setError('An unexpected error occurred while loading providers');
        console.error('Error loading providers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProviders();
  }, []);

  // Duplicate the array for seamless infinite scroll (only if we have providers)
  const duplicatedProviders = foodProviders.length > 0 ? [...foodProviders, ...foodProviders] : [];

  // Helper function to get fallback image
  const getProviderImage = (provider) => {
    if (provider.banner) return provider.banner;
    if (provider.logo) return provider.logo;
    // Fallback to a generic food provider image
    return 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
  };

  // Helper function to get rating (fallback to 4.5 if not available)
  const getProviderRating = (provider) => {
    // You might have a rating field in the future, for now use a default
    return provider.rating || 4.5;
  };

  // Helper function to format business tags as specialties
  const getProviderSpecialties = (provider) => {
    if (provider.business_tags && provider.business_tags.length > 0) {
      return provider.business_tags;
    }
    // Fallback based on business name or type
    return ['Food Provider'];
  };

  const handleMouseEnter = () => {
    if (scrollRef.current && duplicatedProviders.length > 0) {
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
    if (!isDragging && scrollRef.current && duplicatedProviders.length > 0) {
      scrollRef.current.style.animationPlayState = 'running';
      setIsPaused(false);
    }
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    if (!isPaused || duplicatedProviders.length === 0) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(currentTransform);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !isPaused || duplicatedProviders.length === 0) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1;
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
    if (!isPaused || duplicatedProviders.length === 0) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(currentTransform);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !isPaused || duplicatedProviders.length === 0) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1;
    const newTransform = scrollLeft + walk;
    setCurrentTransform(newTransform);
    scrollRef.current.style.transform = `translateX(${newTransform}px)`;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Shop by Food Provider
            </h2>
            <p className="text-gray-600">
              Loading food providers...
            </p>
          </div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-64 px-3">
              <div className="bg-gray-50 rounded-lg overflow-hidden animate-pulse">
                <div className="w-full h-32 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2 w-3/4"></div>
                  <div className="flex gap-1 mb-3">
                    <div className="h-6 bg-gray-300 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-300 rounded-full w-12"></div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Shop by Food Provider
            </h2>
            <p className="text-red-600">
              {error}
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Unable to load food providers at the moment.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (foodProviders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Shop by Food Provider
            </h2>
            <p className="text-gray-600">
              No food providers available at the moment
            </p>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Check back later for new food providers!</p>
        </div>
      </div>
    );
  }

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
                    src={getProviderImage(provider)}
                    alt={provider.business_name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to default image if provider image fails to load
                      e.target.src = 'https://images.unsplash.com/photo-1555507036-ab794f575c5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Star size={12} className="text-yellow-400 fill-current mr-1" />
                    <span className="text-xs font-semibold text-gray-700">
                      {getProviderRating(provider)}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-emerald-600 transition-colors">
                    {provider.business_name}
                  </h3>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {provider.active_listings_count || 0} listings available
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {getProviderSpecialties(provider).slice(0, 2).map((specialty, specIndex) => (
                      <span
                        key={specIndex}
                        className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {getProviderSpecialties(provider).length > 2 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        +{getProviderSpecialties(provider).length - 2}
                      </span>
                    )}
                  </div>
                  
                  <Link
                    to={`/provider/${provider.id}`}
                    className="block w-full py-2 text-sm font-medium text-emerald-600 border border-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-colors duration-200 text-center"
                  >
                    View Options
                  </Link>
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