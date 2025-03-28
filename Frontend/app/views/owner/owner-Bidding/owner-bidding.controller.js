myApp.controller("ownerBiddingController", [
  "$scope",
  "IndexedDBService",
  "$q",
  "BiddingService",
  "ToastService",
  function ($scope, IndexedDBService, $q, BiddingService,ToastService) {
    $scope.biddings = []; // declaration and initialization of biddings
    $scope.selectedSort = "car.name"; // default value for sorting

    /**
     * @description - executes when page loads
     */
    $scope.init = function () {
      $scope.isLoading = true;
      $scope
        .getAllBidding()
        .then((allOwnerBiddings) => {
          console.log(allOwnerBiddings);
          $scope.biddings = allOwnerBiddings;
          $scope.isLoading = false;
        })
        .catch(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description - fetch all the bids from db and filter bids that are not accepted
     * and map blob to image url and then resolve the bids
     * @returns {promise}
     */
    $scope.getAllBidding = function () {
      let deferred = $q.defer();
     BiddingService.getAllBids()
        .then((allOwnerBiddings) => {
          console.log("allOwnerBiddings",allOwnerBiddings.data);
          deferred.resolve(allOwnerBiddings.data);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    /**
     * @description - this will update bit status to accepted in database and update car approves field
     * and reject all overlapping bids, then promise will be resolved
     * @param {Object} bid
     * @returns {Promise}
     */
    $scope.acceptBid = function (bid) {

      BiddingService.acceptBid(bid._id).then((response)=>{
        console.log("bid accepted successfully");
        console.log(response);
          bid.status="accepted";
          console.log("response.data.rejectedBidIds",response.data.rejectedBidIds);
          if(response.data.rejectedBidIds.length!==0)
          updateBiddingStatusInView(response.rejectedBidIds);
        })
        .catch((error) => {
          console.error("Error in bid approval:", error);
          ToastService.error("Bid not approved", 3000);
        });
    };
    

    /**
     * @description - In this bit status is updated to rejected in database
     * @param {Object} bid
     */
    $scope.rejectBid = function (bid) {
      BiddingService.rejectBid(bid._id)
        .then(() => {
          (bid.status = "rejected");
          ToastService.success("Bid rejected",3000);
        })
        .catch((e) => {
          console.log("Error updating status", e);
          ToastService.error("Bid not rejected", 3000);
        });
    };

    /**
     * @description - this function will change all the rejected bids status to rejected in view
     * so that filter will be applied correctly
     * @param {Array of objects} rejectedBids
     */
    updateBiddingStatusInView = function (rejectedBids) {
      rejectedBids.forEach((id) => {
        let bid = $scope.biddings.find((b) => b.id === id);
        if (bid) {
          bid.status = "rejected";
        }
      });
    };

    
  },
]);
