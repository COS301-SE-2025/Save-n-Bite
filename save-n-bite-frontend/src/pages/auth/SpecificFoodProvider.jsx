import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPinIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  PhoneIcon,
  GlobeIcon,
  ShoppingCartIcon,
} from 'lucide-react'

import ReviewsModal from '../../components/auth/ReviewModal'
import CustomerNavBar from '../../components/auth/CustomerNavBar'
// Mock data for a single provider
const provider = {
  id: 1,
  name: 'Sweet Bakery',
  image:
    'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
  logo: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80',
  address: '123 Main St, Eco City',
  phone: '071 123 4567',
  hours: 'Mon-Fri: 7am-7pm, Sat-Sun: 8am-6pm',
  rating: 4.8,
  reviews: 156,
  categories: ['Bakery', 'Pastries', 'Bread'],
}
// Mock data for provider's items
const providerItems = [
  {
    id: 1,
    title: 'Assorted Pastries Box',
    image:
      'https://images.unsplash.com/photo-1609950547346-a4f431435b2b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 18.99,
    discountPrice: 7.99,
    // expirationTime: 'Today, 8 PM',
    type: 'Discount',
    
  },
  {
    id: 2,
    title: 'Sourdough Bread Loaf',
    image:
      'https://images.unsplash.com/photo-1585478259715-4aa341a5ce8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 7.5,
    discountPrice: 3.5,
    // expirationTime: 'Today, 8 PM',
    type: 'Discount',
   
  },
  {
    id: 3,
    title: 'Fresh Bread Assortment',
    image:
      'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 15.0,
    discountPrice: 6.0,
    // expirationTime: 'Tomorrow, 10 AM',
    type: 'Discount',
   
  },
  {
    id: 4,
    title: 'Chocolate Croissants (4)',
    image:
      'https://images.unsplash.com/photo-1623334044303-241021148842?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 12.0,
    discountPrice: 5.0,
    // expirationTime: 'Today, 8 PM',
    type: 'Discount',
   
  },
  {
    id: 5,
    title: 'Artisan Bagels (6)',
    image:
      'https://images.unsplash.com/photo-1585478259069-4a3278c17f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80',
    originalPrice: 10.99,
    discountPrice: 0,
    // expirationTime: 'Tomorrow, 10 AM',
    type: 'Donation',
    
  },
]
  const providerReviews = [
  {
    id: 1,
    userName: 'Emily Johnson',
    userImage:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 12, 2023',
    comment:
      'The pastries from Sweet Bakery are absolutely delicious! I picked up their discounted assortment box and everything was still incredibly fresh. Great way to enjoy quality baked goods while reducing food waste.',
    helpful: 24,
    isHelpful: true,
  },
  {
    id: 2,
    userName: 'Michael Chen',
    userImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 4,
    date: 'May 30, 2023',
    comment:
      "I'm a regular customer at Sweet Bakery. Their sourdough bread is exceptional, and being able to get it at a discount at the end of the day is a bonus. The staff is always friendly and helpful.",
    helpful: 15,
    isHelpful: false,
  },
  {
    id: 3,
    userName: 'Sophia Rodriguez',
    userImage:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 5, 2023',
    comment:
      "The chocolate croissants are to die for! I appreciate that Sweet Bakery is committed to reducing food waste. The app makes it easy to see what's available and when to pick it up.",
    helpful: 18,
    isHelpful: false,
  },
  {
    id: 4,
    userName: 'David Kim',
    userImage:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 3,
    date: 'May 22, 2023',
    comment:
      "Good selection of baked goods. Sometimes items sell out quickly, so you have to be fast. The quality is generally good, though I've had a few items that weren't as fresh as expected.",
    helpful: 7,
    isHelpful: false,
  },
  {
    id: 5,
    userName: 'Olivia Martinez',
    userImage:
      'https://images.unsplash.com/photo-1614644147798-f8c0fc9da7f6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'June 8, 2023',
    comment:
      'I love that I can support a local business while also helping reduce food waste. The artisan bagels are amazing and such a great deal through this app. Highly recommend!',
    helpful: 22,
    isHelpful: true,
  },
]
const FoodProviderDetailPage = () => {
  const { id } = useParams()
  const [isFollowing, setIsFollowing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
    const [buttonStatus, setButtonStatus] = useState("idle");
  const [filters, setFilters] = useState({
    priceRange: [0, 20],
    type: 'all',
  })

   const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false)

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
  }
  const addToCart = (itemId) => {
    console.log(`Added item ${itemId} to cart`)
    alert(`Added item to cart!`)
  }
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (buttonStatus === "added") {
      navigate('/cart');
      return;
    }

    setButtonStatus("loading");

    try {
      const response = await foodAPI.addToCart(id, quantity);
      if (response.success) {
        setButtonStatus("added");
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      } else {
        setError(response.error);
        setButtonStatus("idle");
      }
    } catch (err) {
      setError('Failed to add item to cart');
      setButtonStatus("idle");
    }
  };

  const openReviewsModal = () => {
    setIsReviewsModalOpen(true)
  }
  const closeReviewsModal = () => {
    setIsReviewsModalOpen(false)
  }


  return (
    <div className="bg-gray-50 min-h-screen w-full">
        <CustomerNavBar />
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link
            to="/providers"
            className="text-emerald-600 hover:text-emerald-700"
          >
            &larr; Back to providers
          </Link>
        </div>

        {/* Provider Header */}
        <div className="relative mb-8">
          <div className="h-64 w-full rounded-t-lg overflow-hidden">
            <img
              src={provider.image}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-white rounded-b-lg shadow-sm p-6 md:p-8">
            <div className="flex flex-col md:flex-row">
              <div className="md:flex-grow">
                <div className="flex items-start">
                  <div className="relative -mt-16 mr-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm">
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {provider.name}
                    </h1>
                    <div className="flex items-center mt-1 text-sm">
                      <div className="flex items-center text-amber-500">
                        <StarIcon size={16} className="fill-current" />
                        <span className="ml-1">{provider.rating}</span>
                      </div>
                      <button className="ml-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                       onClick={openReviewsModal}>
                        Read Reviews
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <MapPinIcon size={16} className="text-gray-500 mr-2" />
                    <span className="text-gray-600 text-sm">
                      {provider.address}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <PhoneIcon size={16} className="text-gray-500 mr-2" />
                    <span className="text-gray-600 text-sm">
                      {provider.phone}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon size={16} className="text-gray-500 mr-2" />
                    <span className="text-gray-600 text-sm">
                      {provider.hours}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {provider.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-4 md:flex md:flex-col md:justify-center">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-md flex items-center justify-center transition-colors ${isFollowing ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                  <HeartIcon
                    size={18}
                    className={`mr-2 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                
              </div>
            </div>
          </div>
        </div>

        {/* Available Items */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            Available Items from {provider.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {providerItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-0 right-0 m-2">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${item.type === 'Donation' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}
                    >
                      {item.type}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-gray-800">
                    {item.title}
                  </h3>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      {item.type === 'Discount' ? (
                        <div className="flex items-center">
                          <span className="font-semibold text-emerald-600">
                            ${item.discountPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 line-through ml-2">
                            ${item.originalPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-blue-600">
                          Free
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {item.distance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    {/* <span className="text-xs text-gray-500">
                      Expires: {item.expirationTime}
                    </span> */}
                     <button
                                        onClick={handleAddToCart}
                                        disabled={buttonStatus === "loading"}
                                        className={`w-full py-3 ${
                                          buttonStatus === "added" ? "bg-emerald-400" : "bg-emerald-200"
                                        } text-white font-medium rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center`}
                                      >
                                        <ShoppingCartIcon size={20} className="mr-2" />
                                        {buttonStatus === "idle" && "Add to Cart"}
                                        {buttonStatus === "loading" && "Adding..."}
                                        {buttonStatus === "added" && "View Cart"}
                                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {providerItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <p className="text-xl text-gray-600 mb-4">No items available</p>
              <p className="text-gray-500">
                Check back later for new items from this provider
              </p>
            </div>
          )}
        </div>
      </div>
       <ReviewsModal
        isOpen={isReviewsModalOpen}
        onClose={closeReviewsModal}
        providerName={provider.name}
        providerRating={provider.rating}
        totalReviews={provider.reviews}
        reviews={providerReviews}
      />
    </div>
  )
}
export default FoodProviderDetailPage
