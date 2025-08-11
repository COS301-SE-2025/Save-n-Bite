import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/authAPI';
import { validateEmail, validateRequired } from '../../utils/validators';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSuccess, onError, onEmailChange }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const environmentFacts = [
        "🌱 Every ton of food saved prevents 3.3 tons of CO2 emissions!",
        "🌍 Reducing food waste by just 25% could feed 870 million hungry people worldwide.",
        "💧 Wasted food accounts for 25% of all freshwater consumption globally.",
        "🗑️ Food waste generates 8-10% of global greenhouse gas emissions.",
        "🌟 By preventing food waste, you're helping save our planet one meal at a time!",
        "🌳 Saving food is like planting trees - every action counts towards a greener future.",
        "♻️ Food rescue reduces methane emissions from landfills by up to 70%.",
        "🦋 Your actions create a ripple effect that benefits communities and the environment."
    ];

    const getRandomEnvironmentalFact = () => {
        return environmentFacts[Math.floor(Math.random() * environmentFacts.length)];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Track email changes and pass to parent
        if (name === 'email' && onEmailChange) {
            onEmailChange(value);
        }
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Also update parent when component mounts with any existing email
    useEffect(() => {
        if (onEmailChange && formData.email) {
            onEmailChange(formData.email);
        }
    }, []);

    const validateForm = () => {
        const newErrors = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        if (!validateRequired(formData.password)) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createWelcomeMessage = (user) => {
        let welcomeMessage = 'Welcome back! ';
        
        // Handle different user types and their profile data
        if (user.user_type === 'customer' && user.profile?.full_name) {
            welcomeMessage += `${user.profile.full_name}! `;
        } else if (user.user_type === 'provider' && user.profile?.business_name) {
            welcomeMessage += `${user.profile.business_name}! `;
        } else if (user.user_type === 'ngo' && user.profile?.organisation_name) {
            welcomeMessage += `${user.profile.organisation_name}! `;
        } else {
            welcomeMessage += 'Great to see you again! ';
        }
        
        welcomeMessage += getRandomEnvironmentalFact();
        return welcomeMessage;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await authAPI.login(formData);
            
            // Create welcome message using the user data from response
            const welcomeMessage = createWelcomeMessage(response.user);
            
            // Store user data and tokens
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userData', JSON.stringify(response.user));
            
            // Store user's email for pickup coordination
            localStorage.setItem('userEmail', formData.email);
            
            // Store provider's business name if they are a provider
            if (response.user.user_type === 'provider' && response.user.profile?.business_name) {
                localStorage.setItem('providerBusinessName', response.user.profile.business_name);
            }
            
            // Only clear previous pickup orders when a customer logs in (not providers)
            if (response.user.user_type === 'customer') {
                localStorage.removeItem('pickupOrders');
            }
            
            // Pass the complete response with welcome message
            onSuccess({ 
                ...response, 
                welcomeMessage 
            });

            // Navigate based on user type
            const userType = response.user.user_type;
            if (userType === 'provider') {
                navigate('/dashboard');
            } else {
                // Both customers and NGOs go to food listings
                navigate('/food-listing');
            }
        } catch (error) {
            // Improved error handling
            let errorMsg = 'Login failed. Please check your credentials.';
            if (error?.response?.data?.detail) {
                errorMsg = error.response.data.detail;
            } else if (error?.message) {
                errorMsg = error.message;
            } else if (typeof error === 'string') {
                errorMsg = error;
            }
            // Specific field errors (example: backend returns {field: "email", message: "Email not found"})
            if (error?.response?.data?.field && error?.response?.data?.message) {
                errorMsg = `${error.response.data.message}`;
            }
            onError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Email
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Password
                </label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter your password"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 rounded-md text-white font-medium"
                style={{
                    background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
                }}
            >
                {isLoading ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
};

export default LoginForm;