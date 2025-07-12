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
    contactPhone: '071 234 5678',
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
    contactPhone: '071 234 5678',
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
    contactPhone: '071 234 5678',
    contactEmail: 'jennifer.a@example.com'
  }
];

export const donationRequestsData = [
  {
    id: 1,
    requestId: "DON-2023-001",
    itemName: "Fresh Bread Assortment",
    ngoName: "Community Food Bank",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "contact@communityfoodbank.org | 071 234 5678",
    ngoDescription: "Local food bank serving underprivileged families in the community.",
    requestDate: "2023-10-15",
    status: "Pending",
    quantity: "15 loaves",
    expiryDate: "2023-10-18",
    description: "Assortment of fresh bread loaves including whole wheat, sourdough, and multigrain.",
    imageUrl: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    motivationMessage: "We are organizing a community breakfast for 50 homeless individuals this weekend. Your bread donation would significantly help us provide nutritious meals.",
    documents: [
      { name: "NGO_Certification.pdf", url: "#" },
      { name: "Event_Details.pdf", url: "#" }
    ]
  },
  {
    id: 2,
    requestId: "DON-2023-002",
    itemName: "Organic Vegetables Bundle",
    ngoName: "Green Earth Initiative",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "info@greenearthinitiative.org | 071 234 5678",
    ngoDescription: "Environmental NGO focused on sustainable food practices and community gardens.",
    requestDate: "2023-10-14",
    status: "Ready for Pickup",
    pickupDate: "2023-10-16",
    pickupWindow: "10:00 AM - 12:00 PM",
    quantity: "10 kg assorted",
    expiryDate: "2023-10-19",
    description: "Assortment of organic vegetables including carrots, potatoes, tomatoes, and leafy greens.",
    imageUrl: "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    motivationMessage: "We're teaching a cooking class for underprivileged youth to learn about nutrition and healthy eating. These vegetables will be used in the class.",
    documents: [
      { name: "Organization_Certificate.pdf", url: "#" }
    ]
  },
  {
    id: 3,
    requestId: "DON-2023-003",
    itemName: "Pastry Box",
    ngoName: "Helping Hands Shelter",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "coordinator@helpinghands.org | 071 234 5678",
    ngoDescription: "Shelter providing temporary housing and meals for homeless individuals.",
    requestDate: "2023-10-13",
    status: "Pending",
    quantity: "24 pastries",
    expiryDate: "2023-10-17",
    description: "Box of assorted pastries including croissants, danish, and muffins.",
    imageUrl: "https://images.unsplash.com/photo-1600326145359-3a44909d1a39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    motivationMessage: "We're hosting a special breakfast for our shelter residents who are celebrating job placements this month. These pastries would make their celebration more special.",
    documents: [
      { name: "Shelter_License.pdf", url: "#" },
      { name: "Donation_Request_Form.pdf", url: "#" }
    ]
  },
  {
    id: 4,
    requestId: "DON-2023-004",
    itemName: "Fruit Basket",
    ngoName: "Children's Hope Foundation",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "programs@childrenshope.org | 071 234 5678",
    ngoDescription: "Foundation supporting underprivileged children with education and nutrition programs.",
    requestDate: "2023-10-16",
    status: "Ready for Pickup",
    pickupDate: "2023-10-17",
    pickupWindow: "1:00 PM - 3:00 PM",
    quantity: "15 kg mixed fruits",
    expiryDate: "2023-10-21",
    description: "Assorted fresh fruits including apples, oranges, bananas, and seasonal berries.",
    imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2532&q=80",
    motivationMessage: "We run an after-school program for children from low-income families. These fruits will be part of our healthy snack program to ensure kids have proper nutrition.",
    documents: [
      { name: "Foundation_Certificate.pdf", url: "#" },
      { name: "Program_Details.pdf", url: "#" }
    ]
  },
  {
    id: 5,
    requestId: "DON-2023-005",
    itemName: "Dairy Products Bundle",
    ngoName: "Senior Care Network",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "outreach@seniorcare.org | 071 234 5678",
    ngoDescription: "Organization providing support services for elderly individuals in the community.",
    requestDate: "2023-10-12",
    status: "Completed",
    pickupDate: "2023-10-13",
    pickupWindow: "11:00 AM - 1:00 PM",
    completionDate: "2023-10-13",
    quantity: "20 items",
    expiryDate: "2023-10-18",
    description: "Assortment of dairy products including milk, yogurt, and cheese.",
    imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    motivationMessage: "Many seniors in our program have limited access to nutritious food. These dairy products will help us provide essential calcium and protein in our meal deliveries.",
    documents: [
      { name: "Organization_ID.pdf", url: "#" }
    ]
  },
  {
    id: 6,
    requestId: "DON-2023-006",
    itemName: "Sandwich Ingredients",
    ngoName: "Youth Outreach Program",
    ngoLogo: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    ngoContact: "director@youthoutreach.org | 071 234 5678",
    ngoDescription: "Program providing meals and support services for at-risk youth.",
    requestDate: "2023-10-11",
    status: "Completed",
    pickupDate: "2023-10-12",
    pickupWindow: "2:00 PM - 4:00 PM",
    completionDate: "2023-10-12",
    quantity: "Ingredients for 50 sandwiches",
    expiryDate: "2023-10-16",
    description: "Bread, sliced meats, cheese, and vegetables for making sandwiches.",
    imageUrl: "https://images.unsplash.com/photo-1528736235302-52922df5c122?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    motivationMessage: "We're organizing a street outreach event this weekend to provide meals to homeless youth. These ingredients will help us prepare sandwiches for distribution.",
    documents: [
      { name: "Program_License.pdf", url: "#" },
      { name: "Event_Plan.pdf", url: "#" }
    ]
  }
];