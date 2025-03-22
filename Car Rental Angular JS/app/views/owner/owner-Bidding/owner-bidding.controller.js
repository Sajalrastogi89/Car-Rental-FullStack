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
      const owner_id = JSON.parse(sessionStorage.getItem("loginData")).id;
      IndexedDBService.getRecordsUsingIndex("biddings", "owner_id", owner_id)
        .then((allOwnerBiddings) => {
         allOwnerBiddings
              .map((bid) => {
              if (bid.car.image instanceof Blob) {
                bid.car.image = URL.createObjectURL(bid.car.image);
              }
              return bid;
            });
          deferred.resolve(allOwnerBiddings);
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
      let updatedBid = {
        id: bid.id,
        status: "accepted",
      };
    
      IndexedDBService.updateRecord("biddings", updatedBid)
        .then(() => {
          bid.status = "accepted";
    
          let updateCarApprovedField = {
            id: bid.car.id,
            approved: [
              ...(bid.car.approved || []),
              { startDate: bid.car.startDate, endDate: bid.car.endDate },
            ],
          };
    
          console.log("Updated Car Approved Field:", updateCarApprovedField);
    
          return BiddingService.updateCarApproved(updateCarApprovedField);
        })
        .then((approvedBid) => {
          if (!approvedBid) {
            throw new Error("Approved bid update failed");
          }
          console.log("approvedBid", approvedBid);
    
          return BiddingService.rejectOverlappingBids(
            bid.car.id,
            bid.car.startDate,
            bid.car.endDate
          );
        })
        .then((allRejectedBids) => {
          console.log("Rejected Bids:", allRejectedBids);
          updateBiddingStatusInView(allRejectedBids);
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
      let deferred = $q.defer();
      let updatedBid = {
        id: bid.id,
        status: "rejected",
      };
      IndexedDBService.updateRecord("biddings", updatedBid)
        .then(() => {
          (bid.status = "rejected"), deferred.resolve();
        })
        .catch((e) => {
          console.log("Error updating status", e);
          deferred.reject();
        });
    };

    /**
     * @description - this function will change all the rejected bids status to rejected in view
     * so that filter will be applied correctly
     * @param {Array of objects} rejectedBids
     */
    updateBiddingStatusInView = function (rejectedBids) {
      rejectedBids.forEach((rejectedBid) => {
        let bid = $scope.biddings.find((b) => b.id === rejectedBid.id);
        if (bid) {
          bid.status = "rejected";
        }
      });
    };

    
  },
]);
