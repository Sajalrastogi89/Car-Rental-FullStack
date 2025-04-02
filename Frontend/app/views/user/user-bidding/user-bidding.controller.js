/**
 * @description User Bidding Controller - Manages user's car rental bidding operations
 * Handles bid listing, filtering, sorting, and duration calculations for user bids
 */
myApp.controller("userBiddingController", [
  "$scope",
  "BiddingService",
  "ToastService",
  function ($scope, BiddingService, ToastService) {
    // ==========================================
    // State Management
    // ==========================================
    
    /**
     * @type {Array}
     * @description List of all bids placed by the user
     */
    $scope.biddings = [];

    /**
     * @type {string}
     * @description Search query for filtering bids by car name
     */
    $scope.search = "";

    /**
     * @type {string}
     * @description Current sort option for bid listing
     */
    $scope.sortOption = "bidAmount"; // Default sort by bid amount

    /**
     * @type {string}
     * @description Selected filter for bid status
     */
    $scope.selectedFilter = ""; // Default no status filter

    // Pagination states
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.itemsPerPage = 10;

    /**
     * @type {Array}
     * @description Available sorting options for bid listing
     */
    $scope.sortOptions = [
      { value: "bidAmount", label: "Price: Low to High" },
      { value: "createdAt", label: "Created Date: New to Old" },
      { value: "-createdAt", label: "Created Date: Old to New" },
    ];

    /**
     * @type {Object}
     * @description Bid status filter options
     */
    $scope.filterBid = {
      pending: "pending",
      rejected: "rejected",
      accepted: "accepted",
    };

    // ==========================================
    // Initialization
    // ==========================================
    
    /**
     * @description Initialize the bidding dashboard
     * Loads initial bid data and sets up the view
     */
    $scope.init = function() {
      $scope.isLoading = true;
      BiddingService.getAllBids()
        .then((response) => {
          $scope.biddings = response.bids;
          $scope.totalItems = response.metadata.total;
        })
        .catch((e) => {
          ToastService.error("Unable to fetch bids", 3000);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    // ==========================================
    // Data Operations
    // ==========================================
    
    /**
     * @description Fetch filtered bids based on current search, filter, and sort options
     * Updates the bid listing with paginated results
     * @param {number} currentPage - The page number to fetch (defaults to 1)
     */
    $scope.getUserBiddings = function(currentPage = 1) {
      // Build query parameters
      let param = {};
      if ($scope.search) param.carName = $scope.search;
      if ($scope.selectedFilter) param.status = $scope.selectedFilter;
      if ($scope.sortOption) param.sortBy = $scope.sortOption;
      if ($scope.itemsPerPage) param.limit = $scope.itemsPerPage;
      param.page = currentPage;

      // Fetch filtered bids
      BiddingService.getAllBids(param)
        .then((response) => {
          $scope.biddings = response.bids;
          $scope.totalItems = response.metadata.total;
          $scope.currentPage = response.metadata.page;
        })
        .catch((e) => {
          ToastService.error("Unable to fetch bids", 3000);
        });
    };

    // ==========================================
    // Utility Functions
    // ==========================================
    
    /**
     * @description Calculate the duration between two dates in days
     * @param {Date|string} startDate - Start date of the rental period
     * @param {Date|string} endDate - End date of the rental period
     * @returns {number} Number of days between the dates (inclusive)
     */
    $scope.calculateDays = function(startDate, endDate) {
      if (!startDate || !endDate) return 0;

      let start = new Date(startDate);
      let end = new Date(endDate);
      let diff = Math.abs(end - start); // Total milliseconds
      return Math.ceil(diff / (1000 * 3600 * 24)) + 1; // Add 1 to include both start and end days
    };

    // Initialize controller
    $scope.init();
  },
]);
