import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingCartIcon, TrashIcon, CreditCardIcon, ClockIcon } from 'lucide-react';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import schedulingAPI from '../../services/schedulingAPI';

const YourCart = () => {
  const [searchParams] = useSearchParams();
  const focusedItemId = searchParams.get('item');
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Mock universal time slot - used for all items
  const MOCK_TIME_SLOT = {
    start: '08:00',
    end: '17:00',
    date: new Date().toISOString().split('T')[0], // Today's date
    label: 'Business Hours (8:00 AM - 5:00 PM)'
  };

  // Payment form validation states
  const [paymentErrors, setPaymentErrors] = useState({});
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: ''
  });

  // Check if cart has items from multiple providers
  const getCartProviders = () => {
    const providers = new Set();
    cartItems.forEach(item => {
      if (item.provider?.business_name) {
        providers.add(item.provider.business_name);
      }
    });
    return Array.from(providers);
  };

  const hasMultipleProviders = () => {
    return getCartProviders().length > 1;
  };

  useEffect(() => {
    fetchCart();
  }, []);

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

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    // Add spaces every 4 digits
    const parts = [];
    for (let i = 0, len = v.length; i < len; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const v = value.replace(/\D/g, '');
    
    // Add slash after 2 digits
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const validateCardNumber = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (!cleanNumber) {
      return 'Card number is required';
    }
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return 'Card number must be between 13-19 digits';
    }
    
    // Basic Luhn algorithm check
    let sum = 0;
    let shouldDouble = false;
    
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));
      
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    
    if (sum % 10 !== 0) {
      return 'Invalid card number';
    }
    
    return null;
  };

  const validateExpiryDate = (expiryDate) => {
    if (!expiryDate) {
      return 'Expiry date is required';
    }
    
    const cleanDate = expiryDate.replace(/\D/g, '');
    
    if (cleanDate.length !== 4) {
      return 'Please enter MM/YY format';
    }
    
    const month = parseInt(cleanDate.substring(0, 2));
    const year = parseInt(`20${cleanDate.substring(2, 4)}`);
    
    if (month < 1 || month > 12) {
      return 'Invalid month (01-12)';
    }
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return 'Card has expired';
    }
    
    if (year > currentYear + 20) {
      return 'Invalid expiry year';
    }
    
    return null;
  };

  const validateCVV = (cvv) => {
    if (!cvv) {
      return 'CVV is required';
    }
    
    if (!/^\d{3}$/.test(cvv)) {
      return 'CVV must be exactly 3 digits';
    }
    
    return null;
  };

  const handlePaymentInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'card_number') {
      formattedValue = formatCardNumber(value);
      if (formattedValue.replace(/\s/g, '').length > 19) return;
    } else if (field === 'expiry_date') {
      formattedValue = formatExpiryDate(value);
      if (formattedValue.replace(/\D/g, '').length > 4) return;
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length > 3) return;
    }
    
    setPaymentData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear error for this field when user starts typing
    if (paymentErrors[field]) {
      setPaymentErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validatePaymentForm = () => {
    const errors = {
      card_number: validateCardNumber(paymentData.card_number),
      expiry_date: validateExpiryDate(paymentData.expiry_date),
      cvv: validateCVV(paymentData.cvv)
    };
    
    setPaymentErrors(errors);
    
    return !Object.values(errors).some(error => error !== null);
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

// Replace your getMockTimeSlotForListing function with this simpler version
const getMockTimeSlotForListing = async (listingId) => {
  try {
    // Only try to get existing available slots
    const slotsResponse = await schedulingAPI.getAvailableTimeSlots(listingId, MOCK_TIME_SLOT.date);
    
    if (slotsResponse.success && slotsResponse.data.available_slots && slotsResponse.data.available_slots.length > 0) {
      console.log(`Found ${slotsResponse.data.available_slots.length} available slots for listing ${listingId}`);
      return slotsResponse.data.available_slots[0];
    } else {
      // If no slots available, return a simple mock slot
      console.log(`No available slots for listing ${listingId}, using fallback mock slot`);
      return {
        id: `mock-slot-${listingId}-${Date.now()}`,
        date: MOCK_TIME_SLOT.date,
        start_time: MOCK_TIME_SLOT.start,
        end_time: MOCK_TIME_SLOT.end,
        available_spots: 999,
        slot_number: 1
      };
    }
  } catch (error) {
    console.error('Error getting time slots for listing:', listingId, error);
    // Return fallback mock slot on any error
    return {
      id: `fallback-slot-${listingId}-${Date.now()}`,
      date: MOCK_TIME_SLOT.date,
      start_time: MOCK_TIME_SLOT.start,
      end_time: MOCK_TIME_SLOT.end,
      available_spots: 999,
      slot_number: 1
    };
  }
};

// Process all items in single checkout, then schedule individually
const handleCheckoutAllItems = async (paymentDetails) => {
  setIsProcessingCheckout(true);
  try {
    console.log('Starting checkout for all cart items...');
    
    // STEP 1: Store current cart items before processing
    const originalCartItems = [...cartItems];
    const cartStorageKey = `cart_backup_${Date.now()}`;
    localStorage.setItem(cartStorageKey, JSON.stringify(originalCartItems));
    console.log(`Stored ${originalCartItems.length} items in localStorage with key: ${cartStorageKey}`);
    
    const scheduledPickups = [];
    const failedItems = [];
    
    // STEP 2: Single checkout for all items
    console.log('\n=== PROCESSING ALL CART ITEMS IN SINGLE CHECKOUT ===');
    
    const allItemIds = originalCartItems.map(item => item.id);
    const checkoutData = {
      items: allItemIds,
      paymentMethod: "card",
      paymentDetails: {
        cardNumber: paymentDetails.card_number,
        expiryDate: paymentDetails.expiry_date,
        cvv: paymentDetails.cvv,
        cardholderName: "Customer"
      },
      specialInstructions: `Checkout for ${originalCartItems.length} items: ${originalCartItems.map(item => item.name).join(', ')}`
    };

    console.log('Checkout data for all items:', JSON.stringify(checkoutData, null, 2));
    
    const checkoutResponse = await schedulingAPI.checkoutCart(checkoutData);
    
    if (!checkoutResponse.success) {
      console.error('Checkout failed for all items:', checkoutResponse.error);
      setError(`Checkout failed: ${checkoutResponse.error}`);
      return;
    }

    console.log('Checkout successful for all items:', checkoutResponse.data);
    
    const orders = checkoutResponse.data.orders || [];
    if (orders.length === 0) {
      console.error('No orders created');
      setError('No orders were created during checkout');
      return;
    }

    console.log(`Created ${orders.length} orders for ${originalCartItems.length} items`);
    
    // STEP 3: Schedule pickup for each order individually
    console.log('\n=== SCHEDULING INDIVIDUAL PICKUPS ===');
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      
      // Find the corresponding cart item for this order
      // Orders should be in the same sequence as cart items
      const cartItem = originalCartItems[i] || originalCartItems.find(item => 
        order.items?.some(orderItem => orderItem.food_listing_id === (item.food_listing_id || item.listingId || item.listing_id))
      );
      
      if (!cartItem) {
        console.warn(`Could not find cart item for order ${order.id}`);
        failedItems.push({ 
          item: { name: `Order ${order.id}`, id: order.id }, 
          error: 'Could not match order to cart item', 
          stage: 'matching' 
        });
        continue;
      }
      
      console.log(`\n--- Scheduling pickup ${i + 1}/${orders.length}: ${cartItem.name} (Order: ${order.id}) ---`);
      
      try {
        // Get listing ID for scheduling
        const listingId = cartItem.food_listing_id || cartItem.listingId || cartItem.listing_id || cartItem.id;
        
        // Get time slot for this listing
        const timeSlot = await getMockTimeSlotForListing(listingId);
        console.log('Time slot for', cartItem.name, ':', JSON.stringify(timeSlot, null, 2));
        
        // Schedule pickup with the order ID
        const scheduleData = {
          order_id: order.id,
          food_listing_id: listingId,
          time_slot_id: timeSlot.id,
          date: timeSlot.date,
          customer_notes: `Individual pickup for ${cartItem.name}`
        };
        
        console.log('Schedule data for', cartItem.name, ':', JSON.stringify(scheduleData, null, 2));
        
        const scheduleResponse = await schedulingAPI.schedulePickup(scheduleData);
        
        if (scheduleResponse.success) {
          scheduledPickups.push({
            order: order,
            pickup: scheduleResponse.data.pickup,
            qrCode: scheduleResponse.data.qr_code,
            cartItem: cartItem,
            timeSlot: timeSlot
          });
          console.log(`✅ Successfully scheduled pickup for ${cartItem.name}`);
          console.log(`Order ID: ${order.id}, Confirmation: ${scheduleResponse.data.pickup.confirmation_code}`);
        } else {
          console.error(`❌ Failed to schedule pickup for ${cartItem.name}:`, scheduleResponse.error);
          failedItems.push({ item: cartItem, error: scheduleResponse.error, stage: 'scheduling' });
        }
        
      } catch (itemError) {
        console.error(`💥 Error scheduling pickup for ${cartItem.name}:`, itemError);
        failedItems.push({ item: cartItem, error: itemError.message, stage: 'scheduling' });
      }
      
      // Add delay between scheduling items
      if (i < orders.length - 1) {
        console.log('Waiting 300ms before next scheduling...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // STEP 4: Handle results and cleanup
    console.log(`\n=== PROCESSING COMPLETE ===`);
    console.log(`Successfully processed: ${scheduledPickups.length} items`);
    console.log(`Failed items: ${failedItems.length} items`);
    
    // Clean up localStorage after processing
    localStorage.removeItem(cartStorageKey);
    console.log(`Cleaned up localStorage key: ${cartStorageKey}`);
    
    if (failedItems.length > 0) {
      console.error('Failed items:', failedItems);
      
      // Show detailed error information
      const failedItemNames = failedItems.map(fi => `${fi.item.name} (${fi.stage})`).join(', ');
      
      if (scheduledPickups.length === 0) {
        setError(`All items failed to process: ${failedItemNames}. Please try again.`);
        return;
      } else {
        // Partial success - show warning but continue
        setError(`Some items failed: ${failedItemNames}. Successfully processed items will be available for pickup.`);
      }
    }

    if (scheduledPickups.length === 0) {
      setError('No items were successfully processed. Please try again or contact support.');
      return;
    }

    console.log(`🎉 Successfully scheduled ${scheduledPickups.length} individual pickups`);
    
    // Step 5: Clear the cart UI immediately since items are processed
    setCartItems([]);
    
    // Step 6: Navigate to pickup confirmation page with all pickup data
    setTimeout(() => {
      navigate('/pickup', {
        state: scheduledPickups.length === 1 ? {
          // Single item - pass data directly in state root
          orderId: scheduledPickups[0].order.id,
          orderNumber: scheduledPickups[0].order.id,
          confirmationCode: scheduledPickups[0].pickup.confirmation_code,
          pickupId: scheduledPickups[0].pickup.id,
          pickupStatus: scheduledPickups[0].pickup.status,
          itemName: scheduledPickups[0].cartItem.name,
          itemDescription: scheduledPickups[0].cartItem.description || '',
          businessName: scheduledPickups[0].cartItem.provider?.business_name || 'Business',
          pickupDate: scheduledPickups[0].pickup.scheduled_date,
          pickupStartTime: scheduledPickups[0].pickup.scheduled_start_time,
          pickupEndTime: scheduledPickups[0].pickup.scheduled_end_time,
          formattedPickupTime: MOCK_TIME_SLOT.label,
          qrCodeData: scheduledPickups[0].qrCode,
          customerNotes: scheduledPickups[0].pickup.customer_notes,
          quantity: scheduledPickups[0].cartItem.quantity,
          price: scheduledPickups[0].cartItem.price,
          checkoutSuccess: true,
          isMultipleItems: false
        } : {
          // Multiple items - pass data in pickups array
          pickups: scheduledPickups.map(sp => ({
            orderId: sp.order.id,
            orderNumber: sp.order.id,
            confirmationCode: sp.pickup.confirmation_code,
            pickupId: sp.pickup.id,
            pickupStatus: sp.pickup.status,
            itemName: sp.cartItem.name,
            itemDescription: sp.cartItem.description || '',
            businessName: sp.cartItem.provider?.business_name || 'Business',
            pickupDate: sp.pickup.scheduled_date,
            pickupStartTime: sp.pickup.scheduled_start_time,
            pickupEndTime: sp.pickup.scheduled_end_time,
            formattedPickupTime: MOCK_TIME_SLOT.label,
            qrCodeData: sp.qrCode,
            customerNotes: sp.pickup.customer_notes,
            quantity: sp.cartItem.quantity,
            price: sp.cartItem.price
          })),
          
          // Summary data
          totalItems: scheduledPickups.length,
          totalAmount: scheduledPickups.reduce((sum, sp) => sum + (sp.cartItem.price * sp.cartItem.quantity), 0),
          pickupTimeLabel: MOCK_TIME_SLOT.label,
          pickupDate: MOCK_TIME_SLOT.date,
          
          // Success indicators
          isMultipleItems: true,
          checkoutSuccess: true,
          
          // Individual checkout indicators
          isIndividualCheckout: true,
          totalOriginalItems: originalCartItems.length,
          
          // Failed items info (if any)
          failedItems: failedItems.length > 0 ? failedItems.map(fi => ({
            name: fi.item.name,
            error: fi.error,
            stage: fi.stage
          })) : null,
          partialSuccess: failedItems.length > 0 && scheduledPickups.length > 0
        }
      });
    }, 500);

  } catch (err) {
    console.error('💥 Checkout error:', err);
    setError(`Failed to process items: ${err.message}`);
  } finally {
    setIsProcessingCheckout(false);
  }
};

  const handleProceedToPayment = () => {
    // Check for multiple providers before proceeding
    if (hasMultipleProviders()) {
      setError('Please order from one food provider at a time. Remove items from other providers to continue.');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    if (!validatePaymentForm()) {
      return;
    }
    
    handleCheckoutAllItems(paymentData);
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-300">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading cart...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full py-8 transition-colors duration-300">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-md">
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen w-full transition-colors duration-300">
      <CustomerNavBar />
      <div className="container-responsive max-w-4xl mx-auto px-4 pt-4 sm:pt-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-gray-100">Your Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <ShoppingCartIcon size={40} className="sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-3 sm:mb-4">Your cart is empty</p>
            <Link
              to="/food-listing"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors text-sm sm:text-base touch-target"
            >
              Browse Food
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 sm:p-4 mb-3 sm:mb-4 card-responsive transition-colors duration-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md flex-shrink-0" 
                    />
                    <div className="flex-grow min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {item.provider?.business_name}
                      </p>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1 text-sm sm:text-base">
                        R{item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                      <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-md">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                          className="px-2 py-1 sm:px-3 sm:py-2 border-r border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 touch-target"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 sm:px-4 sm:py-2 text-sm sm:text-base border-t border-b border-gray-300 dark:border-gray-700">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                          className="px-2 py-1 sm:px-3 sm:py-2 border-l border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 touch-target"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-gray-400 dark:text-gray-500 hover:text-red-500 touch-target p-1"
                      >
                        <TrashIcon size={16} className="sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-colors duration-300">
                <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name} (x{item.quantity})
                      </span>
                      <span className="text-gray-800 dark:text-gray-100">
                        R{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Total</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      R{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pickup Time Info - No Selection Needed */}
                <div className="mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <ClockIcon size={16} className="text-blue-600 dark:text-blue-400 mr-2" />
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Pickup Time
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Available during business hours: {MOCK_TIME_SLOT.label}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-100 mt-1">
                      All items will be available for pickup during business hours
                    </p>
                  </div>
                </div>

                {/* Multiple Provider Warning */}
                {hasMultipleProviders() && (
                  <div className="mb-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                        Multiple Food Providers Detected
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-100 mb-2">
                        You can only order from one food provider at a time. Please remove items from other providers to continue.
                      </p>
                      <div className="text-xs text-amber-600 dark:text-amber-200">
                        <strong>Providers in cart:</strong>
                        <ul className="mt-1 ml-4">
                          {getCartProviders().map((provider, index) => (
                            <li key={index} className="list-disc">{provider}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleProceedToPayment} 
                  className="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors flex items-center justify-center disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                  disabled={cartItems.length === 0 || isProcessingCheckout}
                >
                  <CreditCardIcon size={20} className="mr-2" />
                  {isProcessingCheckout ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full transition-colors duration-300">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Payment Details</h2>
              
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-md">
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  <ClockIcon size={14} className="inline mr-1" />
                  Pickup: {MOCK_TIME_SLOT.label}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                  {cartItems.length} item{cartItems.length > 1 ? 's' : ''} • Total: R{total.toFixed(2)}
                </p>
              </div>
              
              <form 
                onSubmit={handlePaymentSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Card Number
                  </label>
                  <input 
                    type="text" 
                    value={paymentData.card_number}
                    onChange={(e) => handlePaymentInputChange('card_number', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                      paymentErrors.card_number 
                        ? 'border-red-500 dark:border-red-400' 
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                    placeholder="1234 5678 9012 3456" 
                    maxLength="23"
                    disabled={isProcessingCheckout}
                  />
                  {paymentErrors.card_number && (
                    <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                      {paymentErrors.card_number}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Expiry Date
                    </label>
                    <input 
                      type="text" 
                      value={paymentData.expiry_date}
                      onChange={(e) => handlePaymentInputChange('expiry_date', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                        paymentErrors.expiry_date 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                      placeholder="MM/YY" 
                      maxLength="5"
                      disabled={isProcessingCheckout}
                    />
                    {paymentErrors.expiry_date && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {paymentErrors.expiry_date}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      CVV
                    </label>
                    <input 
                      type="text" 
                      value={paymentData.cvv}
                      onChange={(e) => handlePaymentInputChange('cvv', e.target.value)}
                      className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ${
                        paymentErrors.cvv 
                          ? 'border-red-500 dark:border-red-400' 
                          : 'border-gray-300 dark:border-gray-700'
                      }`}
                      placeholder="123" 
                      maxLength="3"
                      disabled={isProcessingCheckout}
                    />
                    {paymentErrors.cvv && (
                      <p className="text-red-500 dark:text-red-400 text-xs mt-1">
                        {paymentErrors.cvv}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  disabled={!paymentData.card_number || !paymentData.expiry_date || !paymentData.cvv || isProcessingCheckout}
                >
                  {isProcessingCheckout ? 'Processing Payment...' : `Pay R${total.toFixed(2)}`}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPayment(false);
                    setPaymentData({ card_number: '', expiry_date: '', cvv: '' });
                    setPaymentErrors({});
                  }} 
                  className="w-full py-3 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-100"
                  disabled={isProcessingCheckout}
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