myApp.controller("carController", [
  "$stateParams",
  "IndexedDBService",
  "$scope",
  "ToastService",
  "chatService",
  "$q",
  "$timeout", // Add $timeout injection here
  "CarService",
  "BiddingService",
  "$state",
  function (
    $stateParams,
    IndexedDBService,
    $scope,
    ToastService,
    chatService,
    $q,
    $timeout,
    CarService,
    BiddingService,
    $state
  ) {
    $scope.car = {}; // declaration for single car
    $scope.today = new Date().toISOString().split("T")[0]; // fetches todays date
    $scope.flatpickrInitialized = false; // Track if flatpickr has been initialized

    /**
     * @description - this will run when page is loaded and fetch car details using car id
     */
    $scope.init = function () {
      console.log("init");
      $scope.isLoading = true;
      getCarById()
        .then((car) => {
          $scope.car = car;
        })
        .catch((e) => {
          ToastService.error(e, 3000);
          console.log(e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description - fetch car data using car_id and convert blob to temporary image url
     */
    function getCarById() {
      let deferred = $q.defer();
      console.log("abc");
      let carId = $stateParams.id;
      console.log("carId", carId);
      CarService.getCar(carId)
        .then((response) => {
          console.log("car", response);
          deferred.resolve(response.car);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    }

    /**
     * @description - Initialize flatpickr to block booked dates
     * This will be called when the date range input is clicked
     */
    $scope.setupDatePickers = function() {
      // Only fetch dates if we haven't already initialized
      if (!$scope.flatpickrInitialized) {
        console.log("Setting up flatpickr date picker");
        
        // Show loading indicator
        $scope.loadingDates = true;
        
        // Get booked dates from API
        CarService.getBookedDates($scope.car._id)
          .then((response) => {
            console.log("Booked dates received:", response);
            // Use the dates array from the response
            initializeFlatpickr(response.dates || []);
            $scope.flatpickrInitialized = true;
          })
          .catch((error) => {
            console.error("Error fetching booked dates:", error);
            ToastService.error("Failed to load unavailable dates. Please try again.", 3000);
            // Initialize with empty dates array as fallback
            initializeFlatpickr([]);
          })
          .finally(() => {
            $scope.loadingDates = false;
          });
      }
    };

    // Function to initialize flatpickr with range mode
    function initializeFlatpickr(bookedDates) {
      console.log("Initializing date picker with booked dates:", bookedDates);
      
      // Remove duplicates from the booked dates array (if any)
      const uniqueDates = [...new Set(bookedDates)];
      
      // Initialize date range picker
      const rangePicker = flatpickr("#dateRangePicker", {
        mode: "range",
        minDate: "today",
        disable: uniqueDates,
        dateFormat: "Y-m-d",
        onClose: function(selectedDates, dateStr, instance) {
          $timeout(function() {
            if (selectedDates.length === 2) {
              // Check if the range contains any blocked dates
              if (hasBlockedDateInRange(selectedDates[0], selectedDates[1], uniqueDates)) {
                // If blocked dates exist in range, clear selection
                instance.clear();
                ToastService.warning("Your date range includes unavailable dates. Please select a different range.", 3000);
              } else {
                // Use the selected dates directly without adding a day
                // This should match what the user sees in the date picker
                const startDate = new Date(selectedDates[0]);
                const endDate = new Date(selectedDates[1]);
                
                // Convert to YYYY-MM-DD format without shifting days
                $scope.car.startDate = formatDate(startDate);
                $scope.car.endDate = formatDate(endDate);
                
                console.log("Selected date range:", $scope.car.startDate, "to", $scope.car.endDate);
              }
            } else if (selectedDates.length === 1) {
              // Single date selection - use without adding a day
              const startDate = new Date(selectedDates[0]);
              $scope.car.startDate = formatDate(startDate);
              $scope.car.endDate = null;
            } else {
              // No dates selected
              $scope.car.startDate = null;
              $scope.car.endDate = null;
            }
          });
        }
      });
      
      // Store reference to the picker
      $scope.rangePicker = rangePicker;
    }

    /**
     * Format date to YYYY-MM-DD string properly
     */
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    /**
     * Check if any blocked dates exist between start and end dates
     */
    function hasBlockedDateInRange(startDate, endDate, blockedDates) {
      // Create new dates to avoid modifying the originals
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Don't add an extra day - compare the dates exactly as selected
      
      // For each day between start and end, check if it's in the blocked dates
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        // Format current date to YYYY-MM-DD for comparison
        const dateString = formatDate(currentDate);
        
        // Check if this date is in the blocked dates array
        if (blockedDates.includes(dateString)) {
          return true; // Found a blocked date in the range
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // No blocked dates found in the range
      return false;
    }
    
    /**
     * @description - Calculate days between start and end date
     */
    $scope.calculateDays = function() {
      if (!$scope.car.startDate || !$scope.car.endDate) return 0;
      
      const start = new Date($scope.car.startDate);
      const end = new Date($scope.car.endDate);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      // Handle same day booking - should return 1 day
      if ($scope.car.startDate === $scope.car.endDate) {
        return 1;
      }
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end dates
      
      return diffDays;
    };
    
    /**
     * @description - Calculate total price
     */
    $scope.calculatePrice = function() {
      const days = $scope.calculateDays();
      return days * ($scope.car.bidAmount || $scope.car.basePrice || 0);
    };
    
    /**
     * @description - Place bid
     */
    $scope.addBid = function() {
      if (!$scope.car.startDate || !$scope.car.endDate) {
        ToastService.error("Please select both start and end dates", 3000);
        return;
      }
      
      if (!$scope.car.bidAmount || $scope.car.bidAmount < $scope.car.basePrice) {
        ToastService.error("Bid amount must be at least the base price", 3000);
        return;
      }
      
      // Here you would add your bid submission logic
      console.log("Placing bid with details:", {
        carId: $scope.car._id,
        startDate: $scope.car.startDate,
        endDate: $scope.car.endDate,
        bidAmount: $scope.car.bidAmount,
        days: $scope.calculateDays(),
        totalPrice: $scope.calculatePrice()
      });



      let bid = {
        carId: $scope.car._id,
        startDate: $scope.car.startDate,
        endDate: $scope.car.endDate,
        bidAmount: $scope.car.bidAmount
      };

      BiddingService.addBid(bid)
        .then((response) => {
          console.log("Bid placed successfully:", response);
          // Show success notification
          ToastService.success("Bid placed successfully!", 3000);
          $state.go("userBiddings");
        })
        .catch((error) => {
          console.error("Failed to place bid:", error);
          // Show error notification
          ToastService.error("Failed to place bid. Please try again.", 3000);
        });
    };


    $scope.chat = function(owner, car){

      chatService.addChat(owner, car).then((response) => {
        console.log("Chat added successfully:", response);
        // Redirect to chat view
        $state.go("userChat");
      }
      )
      .catch((error) => {
        console.error("Failed to add chat:", error);
        ToastService.error(error.data.message || "Failed to start chat. Please try again.", 3000);
      }
      );
    }
  },
]);
