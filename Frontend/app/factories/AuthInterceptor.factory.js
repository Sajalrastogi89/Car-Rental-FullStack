myApp.factory('AuthInterceptor', ['$q', function($q) {
  return {
    // Intercept every request
    request: function(config) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    },   
  };
}]);
