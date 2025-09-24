// components/ui/Toast.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ 
  message, 
  type = 'success', // 'success', 'error', 'warning', 'info'
  duration = 3000, 
  onClose,
  position = 'top-right' // 'top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, 300); // Animation duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "shadow-lg rounded-lg border backdrop-blur-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-white/95 dark:bg-gray-800/95 border-green-200 dark:border-green-800`;
      case 'error':
        return `${baseStyles} bg-white/95 dark:bg-gray-800/95 border-red-200 dark:border-red-800`;
      case 'warning':
        return `${baseStyles} bg-white/95 dark:bg-gray-800/95 border-yellow-200 dark:border-yellow-800`;
      case 'info':
        return `${baseStyles} bg-white/95 dark:bg-gray-800/95 border-blue-200 dark:border-blue-800`;
      default:
        return `${baseStyles} bg-white/95 dark:bg-gray-800/95 border-green-200 dark:border-green-800`;
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed ${getPositionStyles()} z-50 transition-all duration-300 ${
        isLeaving 
          ? 'opacity-0 transform translate-y-2 scale-95' 
          : 'opacity-100 transform translate-y-0 scale-100'
      }`}
    >
      <div className={`${getStyles()} p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default Toast;