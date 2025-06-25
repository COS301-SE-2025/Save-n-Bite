export const monthlyOrdersData = [
  { month: 'Jan', orders: 45 },
  { month: 'Feb', orders: 52 },
  { month: 'Mar', orders: 48 },
  { month: 'Apr', orders: 61 },
  { month: 'May', orders: 55 },
  { month: 'Jun', orders: 67 },
  { month: 'Jul', orders: 71 },
  { month: 'Aug', orders: 82 },
  { month: 'Sep', orders: 79 },
  { month: 'Oct', orders: 85 },
  { month: 'Nov', orders: 91 },
  { month: 'Dec', orders: 96 }
];
export const salesDonationData = [
  { name: 'Sales', value: 72 },
  { name: 'Donations', value: 28 }
];
export const followersData = [
  { month: 'Jul', followers: 12 },
  { month: 'Aug', followers: 19 },
  { month: 'Sep', followers: 25 },
  { month: 'Oct', followers: 34 },
  { month: 'Nov', followers: 39 },
  { month: 'Dec', followers: 45 }
];
export const sustainabilityData = {
  mealsSaved: 347,
  co2Reduced: 124.5
};

export const ordersData = [
  {
    id: 1,
    orderId: "ORD-2023-001",
    itemName: "Fresh Bread Loaves",
    customerName: "Emma Thompson",
    customerEmail: "emma.thompson@example.com",
    customerPhone: "555-123-4567",
    type: "Sale",
    date: "2023-10-15",
    pickupWindow: "2:00 PM - 4:00 PM",
    pickupDate: "2023-10-16",
    status: "Completed",
    hasReview: true,
    amount: "$24.99",
    imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    review: {
      rating: 5,
      comment: "Absolutely fresh and delicious! Will order again.",
      date: "2023-10-16",
      isPositive: true,
      isResolved: true
    }
  },
  {
    id: 2,
    orderId: "ORD-2023-002",
    itemName: "Organic Vegetables Bundle",
    customerName: "John Davis",
    customerEmail: "john.davis@example.com",
    customerPhone: "555-987-6543",
    type: "Donation",
    date: "2023-10-14",
    pickupWindow: "10:00 AM - 12:00 PM",
    pickupDate: "2023-10-15",
    status: "Completed",
    hasReview: true,
    amount: "N/A",
    imageUrl: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    review: {
      rating: 4,
      comment: "Great quality produce, thank you for the donation!",
      date: "2023-10-15",
      isPositive: true,
      isResolved: true
    }
  },
  {
    id: 3,
    orderId: "ORD-2023-003",
    itemName: "Pastry Box",
    customerName: "Sarah Wilson",
    customerEmail: "sarah.wilson@example.com",
    customerPhone: "555-456-7890",
    type: "Sale",
    date: "2023-10-13",
    pickupWindow: "3:00 PM - 5:00 PM",
    pickupDate: "2023-10-14",
    status: "Confirmed",
    hasReview: true,
    amount: "$18.50",
    imageUrl: "https://images.unsplash.com/photo-1600326145359-3a44909d1a39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    review: {
      rating: 3,
      comment: "Items were good but pickup process was confusing.",
      date: "2023-10-14",
      isPositive: false,
      isResolved: false
    }
  },
  {
    id: 4,
    orderId: "ORD-2023-004",
    itemName: "Fruit Basket",
    customerName: "Michael Brown",
    customerEmail: "michael.brown@example.com",
    customerPhone: "555-789-0123",
    type: "Sale",
    date: "2023-10-16",
    pickupWindow: "1:00 PM - 3:00 PM",
    pickupDate: "2023-10-17",
    status: "Never Collected",
    hasReview: false,
    amount: "$22.75",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80"
  }
];

export const businessFeedbackData = {
  averageRating: 4.5,
  totalReviews: 128,
  followers: 45,
  recentHighlight: {
    comment: "Best bakery in town! Love their commitment to reducing waste.",
    author: "Emma T.",
    date: "2023-10-15"
  },
  ratingDistribution: [
    { rating: 5, count: 75 },
    { rating: 4, count: 35 },
    { rating: 3, count: 12 },
    { rating: 2, count: 4 },
    { rating: 1, count: 2 }
  ]
};

export const pickupsData = [
  {
    id: 1,
    orderNumber: 'ORD-2023-001',
    customerName: 'Emma Thompson',
    items: ['Fresh Bread Loaves (3)', 'Organic Apples (2kg)'],
    pickupWindow: '2:00 PM - 4:00 PM',
    pickupDate: '2023-10-20',
    pickupAddress: '123 Main St, Suite 101',
    status: 'Upcoming',
    isUrgent: false,
    confirmationCode: 'PICK1234',
    qrCodeData: 'ORD-2023-001-PICK1234',
    contactPhone: '555-123-4567',
    contactEmail: 'emma.t@example.com'
  },
  {
    id: 2,
    orderNumber: 'ORD-2023-002',
    customerName: 'Michael Johnson',
    items: ['Pasta Sauce (2)', 'Mixed Vegetables (1kg)'],
    pickupWindow: '3:30 PM - 5:30 PM',
    pickupDate: '2023-10-20',
    pickupAddress: '456 Oak Ave',
    status: 'Active',
    isUrgent: true,
    confirmationCode: 'PICK5678',
    qrCodeData: 'ORD-2023-002-PICK5678',
    contactPhone: '555-234-5678',
    contactEmail: 'michael.j@example.com'
  },
  {
    id: 3,
    orderNumber: 'ORD-2023-003',
    customerName: 'Sarah Williams',
    items: ['Chocolate Croissants (4)', 'Fruit Salad (500g)'],
    pickupWindow: '10:00 AM - 12:00 PM',
    pickupDate: '2023-10-19',
    pickupAddress: '789 Pine Blvd',
    status: 'Completed',
    isUrgent: false,
    confirmationCode: 'PICK9012',
    qrCodeData: 'ORD-2023-003-PICK9012',
    pickupStatus: 'On Time',
    contactPhone: '555-345-6789',
    contactEmail: 'sarah.w@example.com'
  },
  {
    id: 4,
    orderNumber: 'ORD-2023-004',
    customerName: 'David Miller',
    items: ['Sourdough Bread (1)', 'Cheese Selection (250g)'],
    pickupWindow: '1:00 PM - 3:00 PM',
    pickupDate: '2023-10-19',
    pickupAddress: '321 Elm St',
    status: 'Completed',
    isUrgent: false,
    confirmationCode: 'PICK3456',
    qrCodeData: 'ORD-2023-004-PICK3456',
    pickupStatus: 'Late Pickup',
    contactPhone: '555-456-7890',
    contactEmail: 'david.m@example.com'
  },
  {
    id: 5,
    orderNumber: 'ORD-2023-005',
    customerName: 'Jennifer Adams',
    items: ['Vegan Muffins (6)', 'Plant-based Milk (1L)'],
    pickupWindow: '9:00 AM - 11:00 AM',
    pickupDate: '2023-10-18',
    pickupAddress: '654 Maple Rd',
    status: 'Completed',
    isUrgent: false,
    confirmationCode: 'PICK7890',
    qrCodeData: 'ORD-2023-005-PICK7890',
    pickupStatus: 'No Show',
    contactPhone: '555-567-8901',
    contactEmail: 'jennifer.a@example.com'
  }
];