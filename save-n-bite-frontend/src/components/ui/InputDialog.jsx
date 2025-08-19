import React from 'react';
import { XIcon } from 'lucide-react';

export const InputDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    inputValue,
    onInputChange,
    placeholder = "Enter value...",
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    message
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        {message && (
                            <p className="text-gray-600 dark:text-gray-300">{message}</p>
                        )}
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};