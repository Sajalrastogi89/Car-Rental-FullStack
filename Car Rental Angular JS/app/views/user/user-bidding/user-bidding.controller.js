myApp.controller("userBiddingController", [
  "$scope",
  "IndexedDBService",
  "$q",
  function ($scope, IndexedDBService, $q) {
    $scope.biddings = []; // declaration and initialization of biddings

  

    // hardcoded options for dropdown
    $scope.filterBid = {
      pending: "pending",
      rejected: "rejected",
    };
    $scope.selectedSort = "timestamp"; // Default sorting by timestamp
    $scope.selectedFilter = "pending"; // Default filting by pending

    // Initialize bidAmountCompare object for the "less than" filter
    $scope.bidAmountCompare = { value: "" };

    /**
     * @description - executes when page will be loaded
     * and fetch all the biddings
     */

    $scope.init = function () {
      $scope.isLoading = true;
      $scope
        .getUserBiddings()
        .then((allBiddings) => {
          $scope.biddings = allBiddings;
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description - fetch all the bids from db and filter bids that are not accepted
     * and map blob to image url and then resolve the bids
     * @returns {promise}
     */
    $scope.getUserBiddings = function () {
      let deferred = $q.defer();
      const userId = JSON.parse(sessionStorage.getItem("loginData")).id;
      IndexedDBService.getRecordsUsingIndex("biddings", "user_id", userId)
        .then((allBiddings) => {
          const filteredBiddings = allBiddings
            .filter((bid) => bid.status !== "accepted") // Filter bids where isAccepted is false
            .map((bid) => {
              if (bid.car.image instanceof Blob) {
                bid.car.image = URL.createObjectURL(bid.car.image);
              }
              return bid;
            });
          deferred.resolve(filteredBiddings);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };


    // Custom filter function for bid amount
    $scope.priceRangeFilter = function(bid) {
      if (!$scope.bidAmountCompare.value) {
        return true; // No filter applied, return all
      }
      
      // Convert value to number and compare
      let maxValue = parseFloat($scope.bidAmountCompare.value);
      return bid.car.basePrice < maxValue;
    };

    $scope.calculateDays = function(startDate, endDate) {
      if (!startDate || !endDate) return 0;
      
      let start = new Date(startDate);
      let end = new Date(endDate);
      let Diff = Math.abs(end - start); // this will give total milliseconds
      const diffDays = Math.ceil(Diff / (1000 * 3600 * 24)) + 1;
      return diffDays;
    };
    
  },
]);
