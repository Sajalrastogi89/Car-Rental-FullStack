myApp.controller("ownerProfileController", [
  "$scope",
  "AuthService",
  "IndexedDBService",
  "ToastService",
  function ($scope, AuthService, IndexedDBService, ToastService) {

    /**
     * Initialize owner profile
     */
    $scope.init = function() {
      $scope.owner = AuthService.getUser();
    };

    /**
     * @description - Remove session data and redirect owner to auth page
     */
    $scope.logout = function () {
      AuthService.logout();
    };
  }
]);