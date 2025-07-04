import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, TrashIcon, CreditCardIcon, ClockIcon } from 'lucide-react';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import schedulingAPI from '../../services/schedulingAPI';

// Helper to generate 30-minute intervals from a pickup window string (e.g., '09:00-15:00')
function generateTimeIntervals(pickupWindow, intervalMinutes = 30) {
  if (!pickupWindow) return [];
  const [start, end] = pickupWindow.split('-');
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const intervals = [];
  let current = new Date();
  current.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);

  while (current <= endTime) {
    intervals.push(
      current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    );
    current = new Date(current.getTime() + intervalMinutes * 60000);
  }
  return intervals;
}

const YourCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

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
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      let allSlots = [];
      for (const item of cartItems) {
        const listingId = item.listingId || item.id;
        if (!listingId) continue;
        // Only fetch for today for now (can add tomorrow if needed)
        const todayResponse = await schedulingAPI.getAvailableSlots(listingId, today);
        let slots = [];
        if (todayResponse.success) {
          if (todayResponse.data.available_slots && todayResponse.data.available_slots.length > 0) {
            // Use available_slots as before
            todayResponse.data.available_slots.forEach(slot => {
              slots.push({
                value: `${slot.date}-${slot.start_time}-${listingId}`,
                label: `Today ${formatTime(slot.start_time)} (Item: ${item.name})`,
                time: formatTime(slot.start_time),
                date: 'Today',
                slotData: slot,
                listingId,
                itemName: item.name
              });
            });
          } else if (todayResponse.data.food_listing && todayResponse.data.food_listing.pickup_window) {
            // Generate intervals from pickup_window
            const intervals = generateTimeIntervals(todayResponse.data.food_listing.pickup_window);
            slots = intervals.map(time => ({
              value: `${today}-${time}-${listingId}`,
              label: `Today ${time} (Item: ${item.name})`,
              time,
              date: 'Today',
              slotData: { time },
              listingId,
              itemName: item.name
            }));
          }
        }
        allSlots.push(...slots);
      }
      setTimeSlots(allSlots);
    } catch (err) {
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
      // Instead of calling checkout, just navigate to pickup with item id and time slot
      const selectedSlot = timeSlots.find(slot => slot.value === selectedTimeSlot);
      // For now, just use the first item in cartItems (single-item flow)
      const item = cartItems[0];
  
      // Prepare all info for PickupPage
      const orderNumber = generateOrderNumber();
      const confirmationCode = generateConfirmationCode();
      
      // Get user's email from localStorage
      const userEmail = localStorage.getItem('userEmail') || 'customer@example.com';
      
      // Try to get user's name from stored user data
      let customerName = 'Customer';
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.profile?.full_name) {
          customerName = userData.profile.full_name;
        } else if (userData.email) {
          // Use email prefix as name if no full name is available
          customerName = userData.email.split('@')[0];
        }
      } catch (error) {
        console.log('Could not parse user data, using default name');
      }
      
      // Store order data for PickupCoordination page
      const orderData = {
        id: Date.now(), // Simple ID for demo
        orderNumber,
        customerName: customerName, // Use actual customer name if available
        status: 'Active',
        pickupDate: item.expiryDate || new Date().toISOString().split('T')[0], // Use actual expiry date from listing
        pickupWindow: selectedSlot ? selectedSlot.label : selectedTimeSlot,
        items: [item.name],
        contactPhone: 'N/A',
        contactEmail: userEmail, // Use the actual user's email
        confirmationCode,
        itemName: item.name,
        itemDescription: item.description,
        providerName: item.provider?.businessName || item.provider?.business_name || 'Provider',
        providerAddress: item.provider?.business_address || item.provider?.address || 'Pickup Address',
        pickupTime: selectedSlot ? selectedSlot.label : selectedTimeSlot,
        totalAmount: item.price * item.quantity,
        expiryDate: item.expiryDate // Store the actual expiry date
      };
      
      // Store in localStorage for PickupCoordination to access
      const existingOrders = JSON.parse(localStorage.getItem('pickupOrders') || '[]');
      existingOrders.push(orderData);
      localStorage.setItem('pickupOrders', JSON.stringify(existingOrders));
      
      // Add to customer's order history for reviews and feedback
      const orderHistoryData = {
        id: Date.now(),
        orderNumber,
        date: new Date().toISOString().split('T')[0],
        type: item.price > 0 ? 'purchase' : 'donation',
        status: 'completed', // Set as completed for testing review functionality
        items: [
          {
            id: item.id,
            title: item.name,
            image: item.image,
            provider: item.provider?.businessName || item.provider?.business_name || 'Provider',
            quantity: item.quantity,
            price: item.price
          }
        ],
        total: item.price * item.quantity,
        provider: item.provider?.businessName || item.provider?.business_name || 'Provider',
        pickupTime: selectedSlot ? selectedSlot.label : selectedTimeSlot,
        pickupAddress: item.provider?.business_address || item.provider?.address || 'Pickup Address',
        confirmationCode,
        impact: {
          mealsSaved: item.quantity,
          co2Reduced: item.quantity * 0.4 // Rough estimate
        }
      };
      
      // Store in customer's order history
      const existingOrderHistory = JSON.parse(localStorage.getItem('customerOrderHistory') || '[]');
      existingOrderHistory.push(orderHistoryData);
      localStorage.setItem('customerOrderHistory', JSON.stringify(existingOrderHistory));
      
      navigate('/pickup', {
        state: {
          itemName: item.name,
          itemDescription: item.description,
          providerName: item.provider?.businessName || item.provider?.business_name || 'Provider',
          providerAddress: item.provider?.business_address || item.provider?.address || 'Pickup Address',
          pickupTime: selectedSlot ? selectedSlot.label : selectedTimeSlot,
          orderNumber,
          confirmationCode
        }
      });
    } catch (err) {
      setError('Failed to process payment');
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
              onClick={fetchCart}
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
              {cartItems.map(item => (
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
              ))}
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
                          {slot.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedTimeSlot && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your order will be ready for pickup at the selected time
                    </p>
                  )}
                  {timeSlots.length === 0 && !slotsLoading && (
                    <p className="text-xs text-orange-600 mt-1">
                      No pickup slots available. Please try again later.
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