import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import FoodItemHeader from '../../components/auth/FoodItemHeader';
import FoodItemDetails from '../../components/auth/FoodItemDetails';
import PriceDisplay from '../../components/auth/PriceDisplay';
import RelatedItems from '../../components/auth/RelatedItems';
import StoreLocation from '../../components/auth/StoreLocation';
import { ShoppingCartIcon } from 'lucide-react';

const FoodItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [buttonStatus, setButtonStatus] = useState("idle");

  
   const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (buttonStatus === "added") {
      navigate('/cart');
      return;
    }

    setButtonStatus("loading");

    setTimeout(() => {
      setButtonStatus("added");
    }, 1500);
  };

  const foodItem = {
    listing: {
      name: 'Mock Food Box',
      description: 'A delicious assortment of rescued food items.',
      images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3'],
      provider: {
        businessName: 'Mock Kitchen',
        address: '123 Mock Street, Foodville'
      },
      type: 'discount',
      pickupWindow: '10:00 AM - 2:00 PM',
      quantity: 5,
      originalPrice: 120.00,
      discountedPrice: 60.00
    }
  };

 
  const relatedItems = [
    {
      id: '1',
      name: 'Vegetarian Lunch Box',
      images: ['https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3'],
      provider: { businessName: 'Green Cafe' },
      originalPrice: 60.50,
      discountedPrice: 30.00,
      type: 'discount'
    },
    {
      id: '2',
      name: 'Fresh Bread Assortment',
      images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3'],
      provider: { businessName: 'Artisan Bakery' },
      originalPrice: 100.00,
      discountedPrice: 60.00,
      type: 'discount'
    },
    {
      id: '3',
      name: 'Surplus Produce Box',
      images: ['https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-4.0.3'],
      provider: { businessName: 'Local Grocery' },
      originalPrice: 200.00,
      discountedPrice: 60.50,
      type: 'discount'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen w-full">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <Link to="/FoodListing" className="text-emerald-600 hover:text-emerald-700">
            &larr; Back to listings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="md:flex">
            {/* Food Image */}
            <div className="md:w-1/2">
              <img 
                src={foodItem.listing.images[0]} 
                alt={foodItem.listing.name} 
                className="w-full h-64 md:h-full object-cover" 
              />
            </div>

            {/* Food Details */}
            <div className="md:w-1/2 p-6">
              <FoodItemHeader 
                title={foodItem.listing.name} 
                provider={foodItem.listing.provider.businessName} 
                type={foodItem.listing.type} 
              />

              <p className="text-gray-700 mb-6">{foodItem.listing.description}</p>

              <FoodItemDetails 
                pickupWindow={foodItem.listing.pickupWindow}
                address={foodItem.listing.provider.address}
                quantity={foodItem.listing.quantity}
              />

              <PriceDisplay 
                originalPrice={foodItem.listing.originalPrice} 
                discountedPrice={foodItem.listing.discountedPrice} 
              />

              <button
                onClick={handleAddToCart}
                disabled={buttonStatus === "loading"}
                className={`w-full py-3 ${
                  buttonStatus === "added" ? "bg-emerald-800" : "bg-emerald-600"
                } text-white font-medium rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center`}
              >
                <ShoppingCartIcon size={20} className="mr-2" />
                {buttonStatus === "idle" && "Add to Cart"}
                {buttonStatus === "loading" && "Adding..."}
                {buttonStatus === "added" && "View Cart"}
              </button>
            </div>
          </div>

          <StoreLocation address={foodItem.listing.provider.address} />
        </div>

        <RelatedItems items={relatedItems} />
      </div>
    </div>
  );

}
export default FoodItem;
