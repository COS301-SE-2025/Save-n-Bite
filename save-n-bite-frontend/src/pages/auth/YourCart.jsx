import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, TrashIcon, CreditCardIcon, ClockIcon } from 'lucide-react';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import schedulingAPI from '../../services/schedulingAPI';

const YourCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedItemSlots, setSelectedItemSlots] = useState({}); // Track slots per item

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    // Fetch time slots when cart items are loaded
    if (cartItems.length > 0) {
      fetchTimeSlots();
    }
  }, [cartItems]);

  const fetchCart = async () => {
    try {
      const response = await foodAPI.getCart();
      if (response.success) {
        setCartItems(response.data.items || []);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    if (cartItems.length === 0) return;

    setSlotsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let allSlots = [];
      const itemSlotsMap = {};

      for (const item of cartItems) {
        // Use the correct food listing ID - check multiple possible fields
        const listingId = item.food_listing_id || item.listingId || item.listing_id || item.id;
        
        console.log('Cart item structure:', item);
        console.log(`Trying to fetch slots for listing ID: ${listingId}`);
        
        if (!listingId) {
          console.warn('No listing ID found for cart item:', item);
          continue;
        }

        const slotsResponse = await schedulingAPI.getAvailableTimeSlots(listingId);
        
        if (slotsResponse.success && slotsResponse.data.available_slots) {
          const itemSlots = slotsResponse.data.available_slots.map(slot => ({
            value: `${slot.date}-${slot.start_time}-${listingId}-${slot.id}`,
            label: `${formatDate(slot.date)} ${formatTime(slot.start_time)} - ${formatTime(slot.end_time)} (${slot.available_spots} spots)`,
            time: formatTime(slot.start_time),
            date: formatDate(slot.date),
            slotData: slot,
            listingId,
            itemName: item.name,
            available_spots: slot.available_spots,
            location: slot.location // Include location info
          }));
          
          // Store slots for this specific item
          itemSlotsMap[listingId] = itemSlots;
          allSlots.push(...itemSlots);
          
          console.log(`Found ${itemSlots.length} slots for ${item.name}`);
        } else {
          console.log(`No slots found for ${item.name}:`, slotsResponse.error);
          // Set empty array for items with no slots
          itemSlotsMap[listingId] = [];
        }
      }
      
      setTimeSlots(allSlots);
      setSelectedItemSlots(itemSlotsMap);
      
    } catch (err) {
      console.error('Error fetching time slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const formatTime = (timeString) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeItem = async (itemId) => {
    try {
      const response = await foodAPI.removeFromCart(itemId);
      if (response.success) {
        setCartItems(cartItems.filter(item => item.id !== itemId));
        // Clear selected time slot if it was for this item
        const removedItem = cartItems.find(item => item.id === itemId);
        if (removedItem) {
          const listingId = removedItem.food_listing_id || removedItem.listingId || removedItem.listing_id || removedItem.id;
          if (selectedTimeSlot.includes(listingId)) {
            setSelectedTimeSlot('');
          }
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  function generateOrderNumber() {
    return 'SNB' + Math.floor(100000 + Math.random() * 900000);
  }

  function generateConfirmationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

const handleCheckout = async (paymentDetails) => {
    try {
      const selectedSlot = timeSlots.find(slot => slot.value === selectedTimeSlot);
      if (!selectedSlot) {
        setError('Please select a valid time slot');
        return;
      }

      // Get the item corresponding to the selected slot
      const item = cartItems.find(cartItem => {
        const cartListingId = cartItem.food_listing_id || cartItem.listingId || cartItem.listing_id || cartItem.id;
        return cartListingId === selectedSlot.listingId;
      });

      if (!item) {
        setError('Item not found for selected time slot');
        return;
      }

      console.log('Starting checkout process...');
      
      // Step 1: Process checkout and create order
      const checkoutData = {
        paymentMethod: "card",
        paymentDetails: {
          cardNumber: paymentDetails.card_number,
          expiryDate: paymentDetails.expiry_date,
          cvv: paymentDetails.cvv,
          cardholderName: "Customer" // You can get this from user profile
        },
        specialInstructions: "Order from web app"
      };

      const checkoutResponse = await schedulingAPI.checkoutCart(checkoutData);
      
      if (!checkoutResponse.success) {
        setError(`Checkout failed: ${checkoutResponse.error}`);
        return;
      }

      console.log('Checkout successful:', checkoutResponse.data);
      
      // Extract order information from checkout response
      const order = checkoutResponse.data.orders[0]; // Assuming single order for now
      if (!order) {
        setError('No order created during checkout');
        return;
      }

      // Step 2: Get detailed slot information before scheduling
      console.log('Fetching detailed slot information...');
      const detailedSlotsResponse = await schedulingAPI.getAvailableTimeSlots(selectedSlot.listingId);
      
      if (!detailedSlotsResponse.success) {
        setError('Failed to fetch detailed slot information');
        return;
      }

      // Find the specific slot with full details
      const detailedSlot = detailedSlotsResponse.data.available_slots.find(
        slot => slot.id === selectedSlot.slotData.id
      );

      if (!detailedSlot) {
        setError('Selected time slot no longer available');
        return;
      }

      // Step 3: Schedule pickup using the order ID and selected slot
      const scheduleData = {
        order_id: order.id,
        food_listing_id: selectedSlot.listingId,
        time_slot_id: selectedSlot.slotData.id,
        date: selectedSlot.slotData.date,
        customer_notes: "Scheduled via web app"
      };

      console.log('Scheduling pickup with data:', scheduleData);
      
      const scheduleResponse = await schedulingAPI.schedulePickup(scheduleData);
      
      if (!scheduleResponse.success) {
        setError(`Pickup scheduling failed: ${scheduleResponse.error}`);
        return;
      }

      console.log('Pickup scheduled successfully:', scheduleResponse.data);
      
      // Extract all the real data from API responses
      const pickup = scheduleResponse.data.pickup;
      const qrCode = scheduleResponse.data.qr_code;
      
      // Navigate to pickup page with comprehensive data
      navigate('/pickup', {
        state: {
          // Order information
          orderId: order.id,
          orderNumber: order.id,
          
          // Pickup confirmation details
          confirmationCode: pickup.confirmation_code,
          pickupId: pickup.id,
          pickupStatus: pickup.status,
          
          // Food item details
          itemName: detailedSlot.food_listing.name,
          itemDescription: detailedSlot.food_listing.description,
          pickupWindow: detailedSlot.food_listing.pickup_window,
          
          // Business/Provider information
          businessName: detailedSlot.location.contact_person, // or use provider info if available
          
          // Location details
          locationName: detailedSlot.location.name,
          locationAddress: detailedSlot.location.address,
          locationInstructions: detailedSlot.location.instructions,
          contactPerson: detailedSlot.location.contact_person,
          contactPhone: detailedSlot.location.contact_phone,
          
          // Timing information
          pickupDate: pickup.scheduled_date,
          pickupStartTime: pickup.scheduled_start_time,
          pickupEndTime: pickup.scheduled_end_time,
          formattedPickupTime: `${formatDate(pickup.scheduled_date)} ${formatTime(pickup.scheduled_start_time)} - ${formatTime(pickup.scheduled_end_time)}`,
          
          // QR Code data
          qrCodeData: qrCode,
          
          // Additional slot details
          slotNumber: detailedSlot.slot_number,
          availableSpots: detailedSlot.available_spots,
          
          // Customer notes
          customerNotes: pickup.customer_notes
        }
      });

    } catch (err) {
      console.error('Checkout error:', err);
      setError(`Failed to process payment: ${err.message}`);
    }
  };

  const handleProceedToPayment = () => {
    if (!selectedTimeSlot) {
      setError('Please select a pickup time slot');
      return;
    }
    setShowPayment(true);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 w-full py-8">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 w-full py-8">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading cart</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                fetchCart();
              }}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full py-8">
      <CustomerNavBar />
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
            <Link to="/food-listing" className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
              Browse Food
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {cartItems.map(item => {
                const listingId = item.food_listing_id || item.listingId || item.listing_id || item.id;
                const itemSlots = selectedItemSlots[listingId] || [];
                
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 mb-4">
                    <div className="flex items-center">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded-md" 
                      />
                      <div className="ml-4 flex-grow">
                        <h3 className="font-semibold text-gray-800">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">{item.provider?.business_name}</p>
                        <p className="text-emerald-600 font-semibold mt-1">
                          R{item.price.toFixed(2)}
                        </p>
                        {/* Show available slots for this item */}
                        <p className="text-xs text-gray-500 mt-1">
                          {itemSlots.length > 0 
                            ? `${itemSlots.length} pickup slots available`
                            : 'No pickup slots available'
                          }
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                          className="px-2 py-1 border border-gray-300 rounded-l-md hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="px-4 py-1 border-t border-b border-gray-300">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                          className="px-2 py-1 border border-gray-300 rounded-r-md hover:bg-gray-50"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeItem(item.id)} 
                          className="ml-4 text-gray-400 hover:text-red-500"
                        >
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} (x{item.quantity})
                      </span>
                      <span className="text-gray-800">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-emerald-600">
                      R{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pickup Time Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ClockIcon size={16} className="inline mr-1" />
                    Select Pickup Time
                  </label>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading available times...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedTimeSlot}
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Choose a time slot...</option>
                      {timeSlots.map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.itemName}: {slot.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedTimeSlot && (
                    <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                      <p><strong>Location:</strong> {timeSlots.find(s => s.value === selectedTimeSlot)?.location?.address}</p>
                      <p><strong>Contact:</strong> {timeSlots.find(s => s.value === selectedTimeSlot)?.location?.contact_person}</p>
                      <p><strong>Instructions:</strong> {timeSlots.find(s => s.value === selectedTimeSlot)?.location?.instructions}</p>
                    </div>
                  )}
                  {timeSlots.length === 0 && !slotsLoading && (
                    <p className="text-xs text-orange-600 mt-1">
                      No pickup slots available for items in cart.
                    </p>
                  )}
                </div>

                <button 
                  onClick={handleProceedToPayment} 
                  className="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!selectedTimeSlot || slotsLoading}
                >
                  <CreditCardIcon size={20} className="mr-2" />
                  Proceed to Payment
                </button>
                {!selectedTimeSlot && (
                  <p className="text-xs text-red-500 mt-1 text-center">
                    Please select a pickup time to continue
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              {selectedTimeSlot && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                  <p className="text-sm text-emerald-800">
                    <ClockIcon size={14} className="inline mr-1" />
                    Pickup: {timeSlots.find(slot => slot.value === selectedTimeSlot)?.label}
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    {timeSlots.find(slot => slot.value === selectedTimeSlot)?.location?.address}
                  </p>
                </div>
              )}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  handleCheckout({
                    card_number: formData.get('card_number'),
                    expiry_date: formData.get('expiry_date'),
                    cvv: formData.get('cvv')
                  });
                }} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input 
                    type="text" 
                    name="card_number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                    placeholder="1234 5678 9012 3456" 
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input 
                      type="text" 
                      name="expiry_date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                      placeholder="MM/YY" 
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input 
                      type="text" 
                      name="cvv"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md" 
                      placeholder="123" 
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Pay R{total.toFixed(2)}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowPayment(false)} 
                  className="w-full py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourCart;