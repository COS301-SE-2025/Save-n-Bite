import React, { useEffect } from 'react';
import { XIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';

export const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100';
            case 'error':
                return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100';
            case 'warning':
                return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100';
            default:
                return 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5" />;
            case 'error':
                return <AlertCircleIcon className="w-5 h-5" />;
            default:
                return <InfoIcon className="w-5 h-5" />;
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${getToastStyles()}`}>
            <div className="flex items-center">
                <span className="mr-2">{getIcon()}</span>
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-4 text-current hover:text-gray-700 dark:hover:text-gray-300"
            >
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};