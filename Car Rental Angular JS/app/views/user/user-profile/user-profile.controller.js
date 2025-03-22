myApp.controller("userProfileController", [
  "$scope",
  "AuthService",
  "IndexedDBService",
  "ToastService",
  "$state",
  function ($scope, AuthService, IndexedDBService, ToastService, $state) {

    /**
     * Initialize user profile
     */
    $scope.init = function() {
      AuthService.userProfile().then((response) => {
        console.log("response", response);
        response.data.userData.createdAt = response.data.userData.createdAt.split("T")[0];
        $scope.user = response.data.userData;
      }
      ).catch((error) => {
        ToastService.error(error.data?.message || "Error fetching user profile!", 3000
        );
      });
    };

    /**
     * @description - Remove session data and redirect user to auth page
     */
    $scope.logout = function () {
      
      AuthService.logout().then((response) => {
        $state.go("auth");
      }
      ).catch((error) => {
        ToastService.error(error.data?.message || "Error logging out!", 3000);
      });
    };
    
  }
]);