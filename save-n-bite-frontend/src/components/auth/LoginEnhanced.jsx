import React, { useState } from 'react';
import ForgotPassword from '../../services/ForgotPasswordAPI';
import { validateEmail, validateRequired } from '../../utils/validators';
import { useNavigate } from 'react-router-dom';

const LoginEnhanced = ({ onSuccess, onError }) => {
    const [step, setStep] = useState('login'); // 'login' or 'change_password'
    const [formData, setFormData] = useState({
        email: '',
        temporary_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [userToken, setUserToken] = useState('');

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
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateLoginForm = () => {
        const newErrors = {};

        if (!validateEmail(formData.email)) {
            newErrors.email = 'Valid email is required';
        }

        if (!validateRequired(formData.temporary_password)) {
            newErrors.temporary_password = 'Temporary password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordForm = () => {
        const newErrors = {};

        if (!validateRequired(formData.new_password)) {
            newErrors.new_password = 'New password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters long';
        }

        if (!validateRequired(formData.confirm_password)) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createWelcomeMessage = (user) => {
        let welcomeMessage = 'Password reset successful! Welcome back, ';
        
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

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        if (!validateLoginForm()) return;

        setIsLoading(true);
        try {
            // Step 1: Login with temporary password using LoginEnhanced endpoint
            const loginResponse = await ForgotPassword.LoginEnhanced(formData.email, formData.temporary_password);
            
            if (loginResponse.success) {
                const userData = loginResponse.data;
                
                // Store the token for next steps
                setUserToken(userData.token);
                
                // Check if password change is required
                if (userData.password_change_required) {
                    setStep('change_password');
                } else {
                    // Login successful, no password change needed
                    localStorage.setItem('authToken', userData.token);
                    localStorage.setItem('userData', JSON.stringify(userData.user));
                    localStorage.setItem('userEmail', formData.email);
                    
                    const welcomeMessage = createWelcomeMessage(userData.user);
                    onSuccess({ 
                        ...userData, 
                        welcomeMessage 
                    });
                }
            } else {
                onError(loginResponse.error || 'Login failed with temporary password');
            }
        } catch (error) {
            onError('An unexpected error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        if (!validatePasswordForm()) return;

        setIsLoading(true);
        try {
            // Step 2: Change temporary password using ChangeTemporaryPassword endpoint
            const changeResponse = await ForgotPassword.ChangeTemporaryPassword(
                userToken,
                formData.temporary_password,
                formData.new_password,
                formData.confirm_password
            );
            
            if (changeResponse.success) {
                // Password changed successfully, store auth data
                localStorage.setItem('authToken', userToken);
                localStorage.setItem('userEmail', formData.email);
                
                // Try to get user data from token (decode JWT payload)
                try {
                    const userData = JSON.parse(atob(userToken.split('.')[1]));
                    const userObj = {
                        id: userData.user_id,
                        email: userData.email,
                        user_type: userData.user_type
                    };
                    localStorage.setItem('userData', JSON.stringify(userObj));
                    
                    const welcomeMessage = 'Password reset successful! ' + getRandomEnvironmentalFact();
                    
                    onSuccess({ 
                        token: userToken,
                        user: userObj,
                        welcomeMessage 
                    });
                } catch (tokenError) {
                    // Fallback if token decode fails
                    const welcomeMessage = 'Password reset successful! ' + getRandomEnvironmentalFact();
                    onSuccess({ 
                        token: userToken,
                        welcomeMessage 
                    });
                }
            } else {
                onError(changeResponse.error || 'Failed to change password');
            }
        } catch (error) {
            onError('An unexpected error occurred while changing password');
        } finally {
            setIsLoading(false);
        }
    };

    // Password change step
    if (step === 'change_password') {
        return (
            <div className="space-y-4">
                <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                    <p className="text-sm font-medium">Temporary password accepted!</p>
                    <p className="text-sm mt-1">
                        Please set a new permanent password to complete the reset process.
                    </p>
                </div>
                
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="new_password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Enter a new password (min 8 characters)"
                        />
                        {errors.new_password && <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>}
                    </div>

                    <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm_password"
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                            placeholder="Confirm your new password"
                        />
                        {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 rounded-md text-white font-medium"
                        style={{
                            background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
                        }}
                    >
                        {isLoading ? 'Setting New Password...' : 'Set New Password'}
                    </button>
                </form>
            </div>
        );
    }

    // Login with temporary password step
    return (
        <div className="space-y-4">
            <div className="mb-4 p-3 bg-amber-100 text-amber-700 rounded-md border border-amber-200">
                <p className="text-sm font-medium"> Check your email</p>
                <p className="text-sm mt-1">
                    Use the temporary password sent to your email to login and reset your password.
                </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label htmlFor="temporary_password" className="block text-sm font-medium text-gray-700 mb-1">
                        Temporary Password
                    </label>
                    <input
                        type="password"
                        id="temporary_password"
                        name="temporary_password"
                        value={formData.temporary_password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Enter temporary password from email"
                    />
                    {errors.temporary_password && <p className="mt-1 text-sm text-red-600">{errors.temporary_password}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                        Check your email for the temporary password
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 rounded-md text-white font-medium"
                    style={{
                        background: 'linear-gradient(135deg, #62BD38 0%, #1E64D5 100%)'
                    }}
                >
                    {isLoading ? 'Verifying...' : 'Continue with Temporary Password'}
                </button>
            </form>
        </div>
    );
};

export default LoginEnhanced;