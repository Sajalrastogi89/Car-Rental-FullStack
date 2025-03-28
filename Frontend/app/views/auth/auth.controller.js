myApp.controller("AuthController", [
  "$scope",
  "$state",
  "ToastService",
  "UserFactory",
  function (
    $scope,
    $state,
    ToastService,
    UserFactory
  ) {
    $scope.activeTab = 0;
    $scope.loginData = {};
    $scope.user = { role: "user" };

    $scope.login = function () {
      UserFactory.loginUser($scope.loginData)
        .then((response) => {
          $state.go(response.user.role);
        })
        .catch((error) => {
          ToastService.error(error.data?.message || "Error logging in!", 3000);
        });
    };

    $scope.register = function () {
      let user = { ...$scope.user };
      UserFactory.addUser(user)
        .then((response) => {
          $scope.loginData.email = user.email;
          $scope.loginData.password = user.password;
          $scope.login();
        })
        .catch((error) => {
          ToastService.error(error.data?.message || "Error adding user!", 3000);
        });
    };

  },
]);
