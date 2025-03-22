myApp.service("BiddingService", [
  "IndexedDBService","$q",
  function (IndexedDBService,$q) {

    /**
     * @description - this will fetch all bids on particular car and update clashing bids status to
     * rejected
     * @param {Number} carId 
     * @param {Date} carStartDate 
     * @param {Date} carEndDate 
     * @returns - array of objects
     */
    this.rejectOverlappingBids = function (carId, carStartDate, carEndDate) {
      let deferred = $q.defer();
      IndexedDBService.getRecordsUsingIndex("biddings", "car_id", carId)
      .then((allBiddingsUsingCarId) => {
        let updatedBids = allBiddingsUsingCarId
        .filter(bid => bid.status === 'pending' && bid.car.startDate <= carEndDate && bid.car.endDate >= carStartDate)
        .map(bid => {
          bid.status = 'rejected'; // Update status
          return bid;
        });
        if (updatedBids.length === 0) {
          deferred.resolve([]); 
          return;
        }

        $q.all(updatedBids.map(bid => IndexedDBService.updateRecord("biddings", bid)))
        .then((results) => {
          deferred.resolve(results);
        })
        .catch((e) => {
          console.error("Error updating bids:", e);
          deferred.reject(e);
        });
      })
      .catch((e) => {
        console.error("Error fetching bids:", e);
        deferred.reject(e);
      });
      return deferred.promise;
    };
  
/**
 * @description - this will update approved dates for particular car
 * @param {array of objects} approvedDates 
 */
    this.updateCarApproved = function (approvedDates) {
      let deferred=$q.defer();
      IndexedDBService.updateRecord("cars", approvedDates).then((car)=>{
        console.log("bidding service",car);
        deferred.resolve(car);
      }).catch((e)=>{
        console.log(e);
        deferred.reject(e);
      })
      return deferred.promise;
    };
  },
]);
