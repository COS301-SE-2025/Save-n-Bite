import React from 'react';
import { XIcon, AlertCircleIcon } from 'lucide-react';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <AlertCircleIcon className="w-6 h-6 text-red-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};