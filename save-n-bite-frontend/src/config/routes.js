
export const ROUTES = {

  PUBLIC: [
    { path: '/login', component: 'Login' },
    { path: '/register', component: 'Register' },
    { path: '/forgot-password', component: 'ForgotPassword' },
    { path: '/', component: 'Home' }
  ],

  
  CUSTOMER_NGO: [
    { path: '/food-listing', component: 'FoodListing' },
    { path: '/item/:id', component: 'FoodItem' },
    { path: '/cart', component: 'Cart' },
    { path: '/orders', component: 'OrderHistory' },
    { path: '/notifications', component: 'Notification' },
    { path: '/donation-request/:id', component: 'DonationRequest' },
    { path: '/donation-confirmation/:id', component: 'DonationConfirmation' },
    { path: '/pickup', component: 'Pickup' },
    { path: '/reviews/:orderId', component: 'Reviews' },
    { path: '/reviews', component: 'Reviews' }
  ],


  PROVIDER: [
    { path: '/dashboard', component: 'Dashboard' },
    { path: '/create-listing', component: 'CreateListing' },
    { path: '/listings-overview', component: 'ListingOverview' },
    { path: '/orders-and-feedback', component: 'OrdersAndFeedback' },
    { path: '/pickup-coordination', component: 'PickupCoordination' },
    { path: '/donations', component: 'ManageDonations' }
  ],


  AUTHENTICATED: [
    { path: '/notifications', component: 'Notification' }
  ]
};


export const USER_TYPES = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  NGO: 'ngo'
};