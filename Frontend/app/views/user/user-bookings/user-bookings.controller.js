myApp.controller("userBookingController", [
  "IndexedDBService",
  "$scope",
  "$q",
  "BookingService",
  function (IndexedDBService, $scope, $q,BookingService) {
    $scope.bookings = []; // declaration and initialization for storing bookings
    // $scope.selectedFilter="paymentStatus";
    $scope.selectedSort = "bidAmount"; // Default sort by price low to high
    $scope.sortBid = {
      timeStamp: "recent",
      basePrice: "base price",
    };

    $scope.filterBooking = {
      "In Progress": false,
      "History": true,
    };
    
    $scope.currentPageAll = 0; // Used in pagination and represents start page number
    $scope.isNextPageAvailable = true; // default value for next page availability
    $scope.isPreviousPageAvailable = false; // default value for previous page unavailability
    pageSize = 8; // Numbers of cars in each page
    currentPage = 0;

    /**
     * @description - this will run when page loaded
     */
    $scope.init = function () {
      $scope.isLoading = true;
      BookingService.getAllBookings()
        .then((allBookings) => {
          console.log("allBookings",allBookings);
          $scope.bookings = allBookings;
        })
        .catch((e) => {
          console.log(e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description - this will fetch all the bookings from database
     * and convert image blob to temporary image url
     */
    let getUserBookings = function (currentPage) {
      let deferred = $q.defer();
      const userId = JSON.parse(sessionStorage.getItem("loginData")).id;
      IndexedDBService.getRecordsUsingPaginationWithIndex(
        "biddings",
        "user_id",
        userId,
        pageSize,
        currentPage * pageSize
      )
        .then((allBookings) => {
          const Bookings = allBookings
          .filter((booking)=>{
            return booking.status==='accepted'
          })
          
            .map((booking) => {
              if (booking.car.image instanceof Blob) {
                booking.car.image = URL.createObjectURL(booking.car.image);
              }
              return booking;
            });
          deferred.resolve(Bookings);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    $scope.getNextSetOfBookings = function (currentPage) {
      $scope.isLoading = true;
      $scope.currentPageAll = currentPage;
      getUserBookings(currentPage)
        .then((bookings) => {
          $scope.isPreviousPageAvailable = currentPage > 0;
          $scope.isNextPageAvailable = bookings.length == 8;
          $scope.bookings = bookings;
        })
        .catch(()=>{
          ToastService.error("Unable to fetch cars", 3000);
        })
        .finally(()=>{
          $scope.isLoading=false;
        })
    };

    $scope.calculateDays = function (startDate,endDate) {
      if (!startDate || !endDate) return 0;
      
      // Create date objects
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Calculate difference in milliseconds
      const Diff = Math.abs(end - start);
      
      // Convert to days and add 1 to include both start and end date
      const diffDays = Math.ceil(Diff / (1000 * 3600 * 24)) + 1;
      
      return diffDays; // Return at least 1 day
    };


  },
]);
