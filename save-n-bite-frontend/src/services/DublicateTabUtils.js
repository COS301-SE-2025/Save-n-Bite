// src/utils/DuplicateTabUtils.js
import storageManager from '../services/StorageManager';

class DuplicateTabUtils {
    
    // Open a new tab in duplicate mode
    static openDuplicateTab(path = '/login') {
        const currentOrigin = window.location.origin;
        const newUrl = `${currentOrigin}${path}?duplicate=true`;
        
        // Open new window with specific features
        const newWindow = window.open(
            newUrl, 
            `duplicate_${Date.now()}`, // unique window name
            'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
        
        // Focus the new window
        if (newWindow) {
            newWindow.focus();
        }
        
        return newWindow;
    }
    
    // Check if current tab is a duplicate
    static isDuplicateTab() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('duplicate') === 'true' || 
               window.name.includes('duplicate') ||
               sessionStorage.getItem('isDuplicateSession') === 'true';
    }
    
    // Initialize duplicate mode for current tab
    static initializeDuplicateMode() {
        if (this.isDuplicateTab()) {
            storageManager.enableDuplicateMode();
            
            // Clean up URL parameter after initialization
            const url = new URL(window.location);
            url.searchParams.delete('duplicate');
            window.history.replaceState({}, '', url);
        }
    }
    
    // Get tab info for debugging
    static getTabInfo() {
        return {
            isDuplicate: this.isDuplicateTab(),
            windowName: window.name,
            storageType: storageManager.getStorageInfo().type,
            hasAuth: storageManager.isAuthenticated(),
            user: storageManager.getCurrentUser()
        };
    }
    
    // Add a button to open duplicate tab (for UI)
    static createDuplicateButton(containerElement, buttonText = 'Open in New Tab') {
        const button = document.createElement('button');
        button.textContent = buttonText;
        button.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600';
        button.addEventListener('click', () => {
            this.openDuplicateTab();
        });
        
        if (containerElement) {
            containerElement.appendChild(button);
        }
        
        return button;
    }
    
    // React component helper for duplicate tab button
    static DuplicateTabButton = ({ children = 'Open in New Tab', className = '', ...props }) => {
        const handleClick = () => {
            DuplicateTabUtils.openDuplicateTab();
        };
        
        return React.createElement(
            'button',
            {
                onClick: handleClick,
                className: `px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${className}`,
                ...props
            },
            children
        );
    };
}

export default DuplicateTabUtils;

// Auto-initialize duplicate mode when module loads
DuplicateTabUtils.initializeDuplicateMode();