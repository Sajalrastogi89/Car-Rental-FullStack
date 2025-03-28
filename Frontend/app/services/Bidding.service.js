myApp.service("BiddingService", [
  "$q",
  "$http",
  function ($q, $http) {
 

    this.addBid = function (bid) {
      let deferred = $q.defer();
      $http
        .post(`http://localhost:8000/api/bidding/addBidding`, bid)
        .then((response) => {
          console.log("Response add bid frontend", response);
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };

    this.getAllBids = function () {
      let deferred = $q.defer();
      $http
        .get(`http://localhost:8000/api/bidding/getAllBids`)
        .then((response) => {
          console.log("Response all bids frontend", response);
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };

    this.acceptBid = function (id) {
      let deffered = $q.defer();
      $http
        .post(
          `http://localhost:8000/api/bidding/acceptBid/${id}`,
          {}          
        )
        .then((response) => {
          deffered.resolve(response.data);
        })
        .catch((e) => {
          deffered.reject(e);
        });
      return deffered.promise;
    };

    this.rejectBid = function (id) { 
      let deferred = $q.defer();
      $http
        .put(
          `http://localhost:8000/api/bidding/rejectBid/${id}`,
          {}          
        )
        .then((response) => {
          console.log(response.data);
          deferred.resolve(response.data);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };
  },
]);
