
const myApp = angular.module('myApp', ['ui.router','ui.bootstrap'
]);

myApp.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}]);