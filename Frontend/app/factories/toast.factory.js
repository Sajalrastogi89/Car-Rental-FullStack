/**
 * @description Toast Service Factory - Manages toast notifications in the application
 * Provides methods for displaying error, success, and info messages using Toastify
 * @module ToastService
 */
myApp.factory("ToastService", [function() {
  // Initialize factory object
  let factory = {};

  /**
   * Default configuration for all toast notifications
   * @constant {Object}
   * @property {boolean} close - Whether the toast can be manually closed
   * @property {string} gravity - Vertical position ('top' or 'bottom')
   * @property {string} position - Horizontal position ('left', 'center', or 'right')
   * @property {boolean} stopOnFocus - Whether to pause the timer when hovering
   */
  const defaultOptions = {
    close: true,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true
  };

  /**
   * Display an error toast notification
   * @param {string} message - The error message to display
   * @param {number} time - Duration in milliseconds to show the toast
   */
  factory.error = function(message, time) {
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#f44336' // Material Design red
    }).showToast();
  };

  /**
   * Display a success toast notification
   * @param {string} message - The success message to display
   * @param {number} time - Duration in milliseconds to show the toast
   */
  factory.success = function(message, time) {
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#4caf50' // Material Design green
    }).showToast();
  };

  /**
   * Display an info toast notification
   * @param {string} message - The info message to display
   * @param {number} time - Duration in milliseconds to show the toast
   */
  factory.info = function(message, time) {
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#2196f3' // Material Design blue (fixed from green)
    }).showToast();
  };

  return factory;
}]);
