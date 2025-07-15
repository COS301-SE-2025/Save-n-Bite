// src/services/StorageManager.js

class StorageManager {
    constructor() {
        this.storageType = this.detectStorageType();
    }

    // Detect if we should use sessionStorage or localStorage
    detectStorageType() {
        // Check if we're in a duplicate/multiple tab scenario
        const urlParams = new URLSearchParams(window.location.search);
        const isDuplicateTab = urlParams.get('duplicate') === 'true' || 
                              window.name.includes('duplicate') ||
                              sessionStorage.getItem('isDuplicateSession') === 'true';
        
        return isDuplicateTab ? 'session' : 'local';
    }

    // Get the appropriate storage object
    getStorage() {
        return this.storageType === 'session' ? sessionStorage : localStorage;
    }

    // Set an item in the appropriate storage
    setItem(key, value) {
        const storage = this.getStorage();
        if (typeof value === 'object') {
            storage.setItem(key, JSON.stringify(value));
        } else {
            storage.setItem(key, value);
        }
        
        // If this is a duplicate session, mark it
        if (this.storageType === 'session') {
            sessionStorage.setItem('isDuplicateSession', 'true');
        }
    }

    // Get an item from the appropriate storage
    getItem(key) {
        const storage = this.getStorage();
        const item = storage.getItem(key);
        
        if (!item) return null;
        
        try {
            return JSON.parse(item);
        } catch {
            return item;
        }
    }

    // Remove an item from the appropriate storage
    removeItem(key) {
        const storage = this.getStorage();
        storage.removeItem(key);
    }

    // Clear all auth-related data
    clearAuthData() {
        const storage = this.getStorage();
        const authKeys = ['authToken', 'userData', 'userEmail', 'providerBusinessName'];
        
        authKeys.forEach(key => {
            storage.removeItem(key);
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getItem('authToken');
    }

    // Get current user data
    getCurrentUser() {
        return this.getItem('userData');
    }

    // Get auth token
    getAuthToken() {
        return this.getItem('authToken');
    }

    // Switch to duplicate mode (for opening new tabs)
    enableDuplicateMode() {
        this.storageType = 'session';
        sessionStorage.setItem('isDuplicateSession', 'true');
        
        // Copy existing localStorage data to sessionStorage for this tab
        const authData = {
            authToken: localStorage.getItem('authToken'),
            userData: localStorage.getItem('userData'),
            userEmail: localStorage.getItem('userEmail'),
            providerBusinessName: localStorage.getItem('providerBusinessName')
        };
        
        Object.entries(authData).forEach(([key, value]) => {
            if (value) {
                sessionStorage.setItem(key, value);
            }
        });
    }

    // Get storage type info for debugging
    getStorageInfo() {
        return {
            type: this.storageType,
            isDuplicate: this.storageType === 'session',
            hasAuthToken: !!this.getAuthToken(),
            user: this.getCurrentUser()
        };
    }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;