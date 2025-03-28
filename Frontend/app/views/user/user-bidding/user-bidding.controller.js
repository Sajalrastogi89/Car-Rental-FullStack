myApp.controller("userBiddingController", [
  "$scope",
  "IndexedDBService",
  "$q",
  "BiddingService",
  function ($scope, IndexedDBService, $q, BiddingService) {
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
      console.log("user bidding");
      BiddingService.getAllBids()
        .then((allBiddings) => {
          console.log("all biddings", allBiddings);
          deferred.resolve(allBiddings.data);
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
      console.log("start date", startDate);
      if (!startDate || !endDate) return 0;
      
      let start = new Date(startDate);
      let end = new Date(endDate);
      let Diff = Math.abs(end - start); // this will give total milliseconds
      const diffDays = Math.ceil(Diff / (1000 * 3600 * 24)) + 1;
      return diffDays;
    };
    
  },
]);
