/**
 * @description Bidding Service - Manages car bidding operations
 * Provides methods for bid creation, retrieval, acceptance, and rejection
 */
myApp.service("BiddingService", [
  "$q",
  "$http",
  function ($q, $http) {
    // ==========================================
    // Bid Creation and Retrieval
    // ==========================================
    
    /**
     * @description Create a new bid for a car
     * @param {Object} bid - The bid object containing bid details
     * @param {string} bid.carId - ID of the car being bid on
     * @param {number} bid.amount - Bid amount
     * @param {string} bid.userId - ID of the user making the bid
     * @returns {Promise<Object>} Promise resolving to the created bid details
     */
    this.addBid = function (bid) {
      let deferred = $q.defer();
      $http
        .post(`http://localhost:8000/api/bidding/addBidding`, bid)
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };

    /**
     * @description Fetch all bids with optional filtering parameters
     * @param {Object} params - Query parameters for filtering bids
     * @param {string} [params.carId] - Filter by car ID
     * @param {string} [params.userId] - Filter by user ID
     * @param {string} [params.status] - Filter by bid status
     * @returns {Promise<Object>} Promise resolving to {bids: Array, metadata: Object}
     */
    this.getAllBids = function (params) {
      let deferred = $q.defer();
      let config = {
        params
      };
      $http
        .get(`http://localhost:8000/api/bidding/getAllBids`, config)
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };

    // ==========================================
    // Bid Status Management
    // ==========================================
    
    /**
     * @description Accept a bid, marking it as the winning bid
     * @param {string} id - ID of the bid to accept
     * @returns {Promise<Object>} Promise resolving to the updated bid details
     */
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

    /**
     * @description Reject a bid, marking it as declined
     * @param {string} id - ID of the bid to reject
     * @returns {Promise<Object>} Promise resolving to the updated bid details
     */
    this.rejectBid = function (id) { 
      let deferred = $q.defer();
      $http
        .put(
          `http://localhost:8000/api/bidding/rejectBid/${id}`,
          {}          
        )
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };
  },
]);
