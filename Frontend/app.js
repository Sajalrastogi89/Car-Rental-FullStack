/**
 * @description Main application module configuration
 * Initializes the Angular application with required dependencies and HTTP interceptor setup
 */

/**
 * @type {Object}
 * @description Angular module instance for the main application
 * @requires ui.router - For client-side routing
 * @requires ui.bootstrap - For Bootstrap UI components
 */
const myApp = angular.module('myApp', [
  'ui.router',    // Handles client-side routing
  'ui.bootstrap'  // Bootstrap UI components
]);

/**
 * @description Configure HTTP interceptors for the application
 * Sets up the AuthInterceptor to handle authentication for all HTTP requests
 */
myApp.config(['$httpProvider', function($httpProvider) {
  // Add authentication interceptor to handle auth tokens
  $httpProvider.interceptors.push('AuthInterceptor');
}]);