import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCartIcon, TrashIcon, CreditCardIcon } from 'lucide-react';
import CustomerNavBar from '../../components/auth/CustomerNavBar';
import foodAPI from '../../services/FoodAPI';

const YourCart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

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

  const handleCheckout = async (paymentDetails) => {
    try {
      const response = await foodAPI.processCheckout({
        payment_method: 'card',
        payment_details: paymentDetails
      });
      
      if (response.success) {
        navigate('/order-success', { 
          state: { 
            orderId: response.data.order_id,
            total: total
          }
        });
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to process payment');
    }
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
                <button 
                  onClick={() => setShowPayment(true)} 
                  className="w-full py-3 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center"
                >
                  <CreditCardIcon size={20} className="mr-2" />
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
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