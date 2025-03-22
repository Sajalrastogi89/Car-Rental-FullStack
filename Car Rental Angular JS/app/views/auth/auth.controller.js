myApp.controller("AuthController", [
  "$scope",
  "$state",
  "IndexedDBService",
  "ToastService",
  "utilFactory",
  "$http",
  "AuthService",
  function (
    $scope,
    $state,
    IndexedDBService,
    ToastService,
    utilFactory,
    $http,
    AuthService
  ) {
    $scope.activeTab = 0;
    $scope.loginData = {};
    $scope.user = { role: "user" };

    $scope.login = function () {
      console.log("loginData", $scope.loginData);
      AuthService.loginUser($scope.loginData)
        .then((response) => {
          $state.go(response.data.user.role);
          console.log("response", response);
        })
        .catch((error) => {
          ToastService.error(error.data?.message || "Error logging in!", 3000);
        });
    };

    $scope.register = function () {
      let user = { ...$scope.user };
      AuthService.registerUser(user)
        .then((response) => {
          $scope.login();
        })
        .catch((error) => {
          ToastService.error(error.data?.message || "Error adding user!", 3000);
        });
    };

    $scope.logout = function () {
      AuthService.logoutUser()
        .then((response) => {
          $state.go("auth");
        })
        .catch((error) => {
          console.log("error", error);
          ToastService.error(error.data?.message || "Error logging out!", 3000);
        });
    };

  },
]);
