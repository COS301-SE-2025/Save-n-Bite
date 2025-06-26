const API_BASE_URL = 'http://localhost:8000/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to make API requests
const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Don't log every API failure to reduce console noise
    // The calling functions will handle the fallback
    throw error;
  }
};

// Customer review functions
export const createReview = async (reviewData) => {
  return makeRequest('create/', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  });
};

export const updateReview = async (reviewId, reviewData) => {
  return makeRequest(`${reviewId}/update/`, {
    method: 'PUT',
    body: JSON.stringify(reviewData),
  });
};

export const deleteReview = async (reviewId) => {
  return makeRequest(`${reviewId}/delete/`, {
    method: 'DELETE',
  });
};

export const getUserReviews = async () => {
  return makeRequest('my-reviews/');
};

export const getUserReviewSummary = async () => {
  return makeRequest('summary/');
};

// Business review functions (for food providers)
export const getBusinessReviews = async () => {
  return makeRequest('business/reviews/');
};

export const getBusinessReviewStats = async () => {
  return makeRequest('business/reviews/stats/');
};

// Mock functions for development (when backend is not available)
export const createReviewMock = async (reviewData) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Store review in localStorage for demo purposes
  const reviews = JSON.parse(localStorage.getItem('customerReviews') || '[]');
  const newReview = {
    id: Date.now().toString(),
    ...reviewData,
    createdAt: new Date().toISOString(),
    status: 'approved'
  };
  reviews.push(newReview);
  localStorage.setItem('customerReviews', JSON.stringify(reviews));
  
  return { success: true, review: newReview };
};

export const getBusinessReviewsMock = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get reviews from localStorage
  const reviews = JSON.parse(localStorage.getItem('customerReviews') || '[]');
  
  // Filter reviews for the current business (provider)
  const currentProvider = localStorage.getItem('providerBusinessName');
  console.log('All reviews in localStorage:', reviews);
  console.log('Current provider looking for:', currentProvider);
  
  const businessReviews = reviews.filter(review => {
    const matches = review.providerName === currentProvider;
    console.log(`Review provider: "${review.providerName}" vs current: "${currentProvider}" - matches: ${matches}`);
    return matches;
  });
  
  console.log('Filtered business reviews:', businessReviews);
  return businessReviews;
};

export const getBusinessReviewStatsMock = async () => {
  const reviews = await getBusinessReviewsMock();
  
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0,
    ratingDistribution: {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    }
  };
  
  return stats;
}; 