myApp.service("AuthService", ["$q", "$state","$http","ToastService", function ($q, $state,$http,ToastService) {




  this.registerUser = function (user) {

    let deferred = $q.defer();

    // setting verified to true for user and false for owner
    if (user.role === "user") {
      user.verified = true;
    } else if (user.role === "owner") {
      user.verified = false;
    }

    // setting name
    user.name = user.firstName + " " + user.lastName;

    // delete unnecessary fields
    delete user.confirmPassword;
    delete user.firstName;
    delete user.lastName;
  
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
    $http.post("http://localhost:8000/api/auth/login", loginData, {
      withCredentials: true
    }).then((response) => {
      deferred.resolve(response);
    }
    ).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }
  

  this.userProfile = function () {
    let deferred = $q.defer();
    $http.get("http://localhost:8000/api/auth/profile", { withCredentials: true }).then((response) => {
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

    $http.get("http://localhost:8000/api/auth/profile", { withCredentials: true }).then((response) => {
     
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
