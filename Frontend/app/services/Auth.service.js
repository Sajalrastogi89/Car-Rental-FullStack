myApp.service("AuthService", ["$q", "$state","$http","ToastService", function ($q, $state,$http,ToastService) {




  this.registerUser = function (user) {

    let deferred = $q.defer();
    $http.post("http://localhost:8000/api/auth/signup", user).then((response) => {
      deferred.resolve(response);
    }).catch((error) => {
      deferred.reject(error);
    });

    return deferred.promise;

  };



  this.loginUser = function(loginData){
    let deferred = $q.defer();
    console.log("loginData",loginData);
    $http.post("http://localhost:8000/api/auth/login", loginData).then((response) => {
      console.log("login response",response);
      localStorage.setItem('token', response.data.auth.token);
      deferred.resolve(response.data);
    }
    ).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }
  

  this.userProfile = function () {
    let deferred = $q.defer();
    $http.get("http://localhost:8000/api/auth/profile").then((response) => {
      deferred.resolve(response);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  };




  /**
   * @description - This will check user role and redirect to suitable page
   * @param {String} requiredRole
   */
  this.requireRole = function (requiredRole) {
    const deferred=$q.defer();

    $http.get("http://localhost:8000/api/auth/profile").then((response) => {
     
      let user = response.data.userData;
      if (user.role === requiredRole) {
        deferred.resolve(); 
      } else {
        throw new Error("Unauthorized");
      }
    }
    ).catch((error) => {
      ToastService.error(error.data?.message || "Unauthorized", 3000);
      $state.go("auth");
      deferred.reject();
    });
    return deferred.promise;
  }

    


  /**
   * @description - This will clear session storage and send user to auth page
   */
  this.logout = function () {
    let deferred = $q.defer();
    $http.post("http://localhost:8000/api/auth/logout",{}, { withCredentials: true }).then((response) => {
      deferred.resolve(response);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  };

}]);
