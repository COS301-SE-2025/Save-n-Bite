import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, MapPin, Plus, Minus, Trash2, CreditCard, ShoppingCart, X } from 'lucide-react';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';
import schedulingAPI from '../../services/schedulingAPI';

// Enhanced Detailed Basket Component with new UI
const DetailedBasket = ({
  provider,
  onBack,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isProcessingCheckout,
  showPayment,
  onClosePayment,
  paymentData,
  paymentErrors,
  onPaymentInput,
  onSubmitPayment
}) => {
  // Calculate subtotal
  const subtotal = provider.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Debug function to log interactions
  const handleUpdateQuantity = (itemId, newQuantity) => {
    console.log('Updating quantity:', { itemId, newQuantity, provider });
    if (onUpdateQuantity) {
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId) => {
    console.log('Removing item:', { itemId, provider });
    if (onRemoveItem) {
      onRemoveItem(itemId);
    }
  };

  const handleCheckout = () => {
    console.log('Checkout clicked:', { provider, subtotal });
    if (onCheckout) {
      onCheckout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CustomerNavBar />
      <br></br>
     
  

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header with back button and title */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Basket</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {provider.business_name} • {provider.items.length} {provider.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </div>

          <div className="md:flex">
            {/* Items List */}
            <div className="flex-1 p-6">
              <div className="space-y-4">
                {provider.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <div className="flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img
                        src={item.image || '/placeholder-food.jpg'}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0 pr-4">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {item.description}
                            </p>
                          )}
                          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                            R {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:space-x-3 flex-wrap justify-end flex-shrink-0 w-full sm:w-auto order-2 sm:order-none">
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 sm:px-2 sm:py-1">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="p-2 sm:p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors"
                            >
                              {item.quantity > 1 && (
                                <Minus className="h-5 w-5 sm:h-4 sm:w-4" />
                              )}

                            </button>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-8 sm:w-6 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="p-2 sm:p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors"
                            >
                              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="md:w-96 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
              <div className="sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  {provider.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-300">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        R {(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-base font-medium text-gray-900 dark:text-white mb-6">
                    <span>Total</span>
                    <span className="text-lg">R {subtotal.toFixed(2)}</span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCheckout}
                    disabled={isProcessingCheckout}
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Proceed to Payment'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Keep your existing modal code here */}
      {showPayment && (
        <PaymentModal
          provider={provider}
          paymentData={paymentData}
          paymentErrors={paymentErrors}
          onPaymentInput={onPaymentInput}
          onSubmit={onSubmitPayment}
          onClose={onClosePayment}
          isProcessingCheckout={isProcessingCheckout}
        />
      )}
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({
  provider,
  paymentData,
  paymentErrors,
  onPaymentInput,
  onSubmit,
  onClose,
  isProcessingCheckout
}) => {
  const total = provider.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Payment Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              disabled={isProcessingCheckout}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Order Summary
                </h3>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  {provider.items.length} {provider.items.length === 1 ? 'item' : 'items'} from {provider.business_name}
                </p>
                <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                  Total: R{total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={paymentData.card_number}
                  onChange={(e) => onPaymentInput('card_number', e.target.value)}
                  className={`block w-full px-4 py-2 border ${paymentErrors.card_number
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                    } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  disabled={isProcessingCheckout}
                />
              </div>
              {paymentErrors.card_number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                  onChange={(e) => onPaymentInput('expiry_date', e.target.value)}
                  className={`block w-full px-4 py-2 border ${paymentErrors.expiry_date
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                    } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={isProcessingCheckout}
                />
                {paymentErrors.expiry_date && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
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
                  onChange={(e) => onPaymentInput('cvv', e.target.value)}
                  className={`block w-full px-4 py-2 border ${paymentErrors.cvv
                      ? 'border-red-500 dark:border-red-400'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500'
                    } rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                  placeholder="123"
                  maxLength="3"
                  disabled={isProcessingCheckout}
                />
                {paymentErrors.cvv && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {paymentErrors.cvv}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={
                  !paymentData.card_number ||
                  !paymentData.expiry_date ||
                  !paymentData.cvv ||
                  isProcessingCheckout
                }
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingCheckout ? 'Processing...' : `Pay R${total.toFixed(2)}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                disabled={isProcessingCheckout}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const YourCart = () => {
  const [searchParams] = useSearchParams();
  const focusedItemId = searchParams.get('item');
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [currentView, setCurrentView] = useState('baskets');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry_date: '',
    cvv: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({});

  // Mock time slot
  const MOCK_TIME_SLOT = {
    start: '08:00',
    end: '17:00',
    date: new Date().toISOString().split('T')[0],
    label: 'Business Hours (8:00 AM - 5:00 PM)'
  };

  // Fetch cart items on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await foodAPI.getCart();
      if (response.success) {
        setCartItems(response.data.items || []);
      } else {
        setError(response.error || 'Failed to load cart');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group items by provider
  const itemsByProvider = cartItems.reduce((acc, item) => {
    const providerId = item.provider?.id || 'unknown';
    if (!acc[providerId]) {
      acc[providerId] = {
        ...item.provider,
        items: [],
        subtotal: 0
      };
    }
    acc[providerId].items.push(item);
    acc[providerId].subtotal += item.price * item.quantity;
    return acc;
  }, {});

  const providers = Object.values(itemsByProvider);
  const totalAmount = providers.reduce((sum, provider) => sum + provider.subtotal, 0);

  // Update your updateQuantity function in YourCart.jsx to show better error messages:
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    try {
      const currentItem = cartItems.find(item => item.id === itemId);
      if (!currentItem) {
        setError('Item not found in cart');
        return;
      }

      const listingId = currentItem.listingId || currentItem.food_listing_id || currentItem.listing_id;

      const response = await foodAPI.updateCartItemQuantity(
        itemId,
        newQuantity,
        currentItem.quantity,
        listingId
      );

      if (response.success) {
        // Success - update UI as before
        const updatedCartResponse = await foodAPI.getCart();
        if (updatedCartResponse.success) {
          const newCartItems = updatedCartResponse.data.items || [];
          setCartItems(newCartItems);

          if (selectedProvider && currentView === 'provider') {
            const updatedItemsByProvider = newCartItems.reduce((acc, item) => {
              const providerId = item.provider?.id || 'unknown';
              if (!acc[providerId]) {
                acc[providerId] = {
                  ...item.provider,
                  items: [],
                  subtotal: 0
                };
              }
              acc[providerId].items.push(item);
              acc[providerId].subtotal += item.price * item.quantity;
              return acc;
            }, {});

            const updatedProvider = updatedItemsByProvider[selectedProvider.id];
            if (updatedProvider) {
              setSelectedProvider(updatedProvider);
            } else {
              setCurrentView('baskets');
              setSelectedProvider(null);
            }
          }
        }

        setError(null);
      } else {
        // Show a more user-friendly error message for stock issues
        let errorMessage = response.error || 'Failed to update quantity';

        // Check if it's a stock-related error and make it more user-friendly
        if (errorMessage.toLowerCase().includes('stock') ||
          errorMessage.toLowerCase().includes('available') ||
          errorMessage.toLowerCase().includes('quantity')) {
          errorMessage = `Sorry, only ${currentItem.quantity} items can be added. Not enough stock available.`;
        }

        setError(errorMessage);

        // Auto-clear the error after 5 seconds
        setTimeout(() => setError(null), 2000);
      }
    } catch (err) {
      setError('Failed to update quantity');
      console.error('Error updating quantity:', err);
    }
  };

  // Also update the removeItem function
  const removeItem = async (itemId) => {
    try {
      const response = await foodAPI.removeFromCart(itemId);
      if (response.success) {
        // Update cartItems state
        const updatedCartItems = cartItems.filter(item => item.id !== itemId);
        setCartItems(updatedCartItems);

        // IMPORTANT: Also update selectedProvider if we're in detailed view
        if (selectedProvider && currentView === 'provider') {
          const updatedProviderItems = selectedProvider.items.filter(item => item.id !== itemId);

          // If no items left in this provider's basket, go back to main view
          if (updatedProviderItems.length === 0) {
            setCurrentView('baskets');
            setSelectedProvider(null);
          } else {
            setSelectedProvider({
              ...selectedProvider,
              items: updatedProviderItems
            });
          }
        }

        // Clear any existing errors
        setError(null);
      } else {
        setError(response.error || 'Failed to remove item');
      }
    } catch (err) {
      setError('Failed to remove item');
      console.error('Error removing item:', err);
    }
  };

  const viewProviderBasket = (provider) => {
    setSelectedProvider(provider);
    setCurrentView('provider');
    setError(null);
  };

  const handleBackToBaskets = () => {
    setCurrentView('baskets');
    setSelectedProvider(null);
  };

  // NEW: Check if cart has items from multiple providers
  const hasMultipleProviders = () => {
    const providerNames = new Set();
    cartItems.forEach(item => {
      if (item.provider?.business_name) {
        providerNames.add(item.provider.business_name);
      }
    });
    return providerNames.size > 1;
  };

  // Add a console log to see if the function is being called
  const handleProceedToPayment = () => {
    console.log("Proceed to payment clicked");
    // Only check for multiple providers if we're in the main baskets view
    if (currentView === 'baskets' && hasMultipleProviders()) {
      setError('Please order from one food provider at a time. Remove items from other providers to continue.');
      return;
    }
    setShowPayment(true);
    console.log("Show payment set to true");
  };


  // NEW: Payment input formatting functions from reference
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length && i < 16; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // NEW: Payment input handler from reference
  const handlePaymentInput = (field, value) => {
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

  // NEW: Validation functions from reference
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

  // NEW: Validate payment form using reference validation
  const validatePaymentForm = () => {
    const errors = {
      card_number: validateCardNumber(paymentData.card_number),
      expiry_date: validateExpiryDate(paymentData.expiry_date),
      cvv: validateCVV(paymentData.cvv)
    };

    setPaymentErrors(errors);

    return !Object.values(errors).some(error => error !== null);
  };

  // NEW: Get mock time slot function from reference
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

  // NEW: Checkout function from reference (modified for single provider)
  const handleCheckoutProviderItems = async (paymentDetails) => {
    setIsProcessingCheckout(true);
    try {
      console.log('Starting checkout for provider items...');

      // Store current cart items before processing
      const originalCartItems = [...cartItems];
      const cartStorageKey = `cart_backup_${Date.now()}`;
      localStorage.setItem(cartStorageKey, JSON.stringify(originalCartItems));

      const scheduledPickups = [];
      const failedItems = [];

      // Checkout for the selected provider's items
      const providerItemIds = selectedProvider.items.map(item => item.id);
      const checkoutData = {
        items: providerItemIds,
        paymentMethod: "card",
        paymentDetails: {
          cardNumber: paymentDetails.card_number.replace(/\s/g, ''),
          expiryDate: paymentDetails.expiry_date,
          cvv: paymentDetails.cvv,
          cardholderName: "Customer"
        },
        specialInstructions: `Checkout for ${selectedProvider.items.length} items from ${selectedProvider.business_name}`
      };

      console.log('Checkout data for provider items:', JSON.stringify(checkoutData, null, 2));

      const checkoutResponse = await schedulingAPI.checkoutCart(checkoutData);

      if (!checkoutResponse.success) {
        console.error('Checkout failed for provider items:', checkoutResponse.error);
        setError(`Checkout failed: ${checkoutResponse.error}`);
        return;
      }

      console.log('Checkout successful for provider items:', checkoutResponse.data);

      const orders = checkoutResponse.data.orders || [];
      if (orders.length === 0) {
        console.error('No orders created');
        setError('No orders were created during checkout');
        return;
      }

      console.log(`Created ${orders.length} orders for ${selectedProvider.items.length} items`);

      // Schedule pickup for each order individually
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];

        // Find the corresponding cart item for this order
        const cartItem = selectedProvider.items[i] || selectedProvider.items.find(item =>
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
            console.error(`Failed to schedule pickup for ${cartItem.name}:`, scheduleResponse.error);
            failedItems.push({ item: cartItem, error: scheduleResponse.error, stage: 'scheduling' });
          }

        } catch (itemError) {
          console.error(`Error scheduling pickup for ${cartItem.name}:`, itemError);
          failedItems.push({ item: cartItem, error: itemError.message, stage: 'scheduling' });
        }

        // Add delay between scheduling items
        if (i < orders.length - 1) {
          console.log('Waiting 300ms before next scheduling...');
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Handle results and cleanup
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

      // Clear the cart items for this provider
      setCartItems(cartItems.filter(item =>
        !selectedProvider.items.some(providerItem => providerItem.id === item.id)
      ));

      // Navigate to pickup confirmation page with all pickup data
      setTimeout(() => {
        navigate('/orders');
      }, 500);

    } catch (err) {
      console.error('💥 Checkout error:', err);
      setError(`Failed to process items: ${err.message}`);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // NEW: Updated payment submit handler
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!validatePaymentForm()) {
      return;
    }

    handleCheckoutProviderItems(paymentData);
  };

  // Loading state (unchanged)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Error state (unchanged)
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-20">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center sm:text-left">
        <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Your Cart</span>
      </h1>
    </div>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg">
            <h3 className="font-medium">Error loading cart</h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchCart}
              className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detailed provider view (unchanged)
  if (currentView === 'provider' && selectedProvider) {
    return (
      <DetailedBasket
        provider={selectedProvider}
        onBack={handleBackToBaskets}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleProceedToPayment}
        isProcessingCheckout={isProcessingCheckout}
        showPayment={showPayment}
        onClosePayment={() => {
          setShowPayment(false);
          setPaymentErrors({});
        }}
        paymentData={paymentData}
        paymentErrors={paymentErrors}
        onPaymentInput={handlePaymentInput}
        onSubmitPayment={handlePaymentSubmit}
      />
    );
  }

  // Empty cart state (unchanged)
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <CustomerNavBar />
        <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-20">
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
      <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Your Cart</span>
    </h1>
  </div>
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 max-w-md mx-auto">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Looks like you haven't added any items yet</p>
            <Link
              to="/food-listing"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Browse Food
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main cart view with provider baskets (unchanged)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CustomerNavBar />

      <div className="max-w-4xl mx-auto px-4 pt-16 sm:pt-20">
    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center sm:text-left">
      <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Your Cart</span>
    </h1>
  </div>

      <div className="max-w-4xl mx-auto px-4 py-4 pb-32">
        <div className="flex items-center justify-between mb-6">
    
          <div className="flex items-center">
            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 text-sm font-medium px-3 py-1 rounded-full">
              {providers.length} {providers.length === 1 ? 'basket' : 'baskets'}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {providers.map((provider, index) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-4"
            >
              {/* Provider Header */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                      {provider.business_name}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{provider.address || 'Pickup available'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                      R {provider.subtotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              {/* <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {provider.items.length} item{provider.items.length !== 1 ? 's' : ''} in basket
                  </span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    Subtotal: R {provider.subtotal.toFixed(2)}
                  </span>
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="px-4 pb-4 pt-2 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => viewProviderBasket(provider)}
                  className="w-full bg-emerald-600 dark:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors hover:bg-emerald-700 dark:hover:bg-emerald-800"
                >
                  View basket
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default YourCart;