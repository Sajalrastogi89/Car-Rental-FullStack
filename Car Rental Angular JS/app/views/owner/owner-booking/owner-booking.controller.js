myApp.controller("ownerBookingController", [
  "$scope",
  "$q",
  "IndexedDBService",
  "ToastService",
  "blobFactory",
  "$uibModal", // Add UI Bootstrap Modal service
  function (
    $scope,
    $q,
    IndexedDBService,
    ToastService,
    blobFactory,
    $uibModal
  ) {
    $scope.bookings = []; // declare and initialize bookings
    $scope.selectedFilter = false; // selected filter is for 'in progress' bookings
    $scope.selectedSort = "car.name";
    // hardcoded dropdown values
    $scope.filterBooking = {
      "In Progess": false,
      "History": true,
    };

    // this will run when page is loaded
    $scope.init = function () {
      $scope.isLoading = true;
      getUserBookings()
        .then((allBookings) => {
          console.log(allBookings);
          $scope.bookings = allBookings;
          $scope.isLoading = false;
        })
        .catch(() => {
          ToastService.error("Unable to fetch bookings");
          $scope.isLoading = false;
        });
    };

    /**
     * @description - this will fetch bookings from database and filter it on the basis of accepted
     * then map image blob to url, update completed status, payment status
     * and then resolve bids
     */
    getUserBookings = function () {
      let deferred = $q.defer();
      const ownerId = JSON.parse(sessionStorage.getItem("loginData")).id;
      IndexedDBService.getRecordsUsingIndex("biddings", "owner_id", ownerId)
        .then((allBookings) => {
          const filteredBookings = allBookings
            .filter((booking) => booking.status === "accepted")
            .map((booking) => {
              if (booking.car.image instanceof Blob) {
                booking.car.image = URL.createObjectURL(booking.car.image);
              }
              if (booking.car.endDate < Date.now()) {
                booking.car.isCompleted = true;
              }
              if (!("paymentStatus" in booking)) booking.paymentStatus = false;
              return booking;
            });
          deferred.resolve(filteredBookings);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    /**
     * @description - This function will check odometer value then calculate distance travelled,
     * total cost and update database
     * @param {Number} odometerReading
     * @param {Object} booking
     */
    $scope.uploadOdometerValue = function (odometerReading, booking) {
      if (odometerReading < booking.car.travelled) {
        ToastService.error("Wrong odometer reading");
        return;
      }
      //calculate total distance and cost
      let [distance, cost] = $scope.calculateTripDetails(
        odometerReading,
        booking
      );
      let carCopy = structuredClone(booking.car);
      blobFactory
        .getImage(carCopy.image)
        .then((image) => {
          carCopy.image = image;
          let updateBooking = {
            id: booking.id,
            paymentStatus: true,
            distanceTravelled: distance,
            car: {
              ...carCopy,
              travelled: (booking.car.travelled || 0) + distance,
            },
            totalAmount: cost,
          };
          //update biddings table in db
          //update car total distance
          return IndexedDBService.updateRecord("biddings", updateBooking);
        })
        .then((updatedBooking) => {
          console.log("updated car travelled in booking", updatedBooking);
          booking.paymentStatus = true;
          booking.distanceTravelled = updatedBooking.distanceTravelled;
          booking.totalAmount = updatedBooking.totalAmount;
          let car = {
            id: updatedBooking.car.id,
            travelled: updatedBooking.car.travelled || 0,
          };
          return IndexedDBService.updateRecord("cars", car);
        })
        .then((car) => {
          ToastService.success("Thank You", 3000);
        })
        .catch((e) => {
          console.log(e);
          ToastService.error(e, 3000);
        });
    };

    /**
     * @description - this function will calculate travelled distance and cost and then return it in array
     * @param {Number} odometerReading
     * @param {Object} booking
     * @returns - array[travelled,cost]
     */
    $scope.calculateTripDetails = function (odometerReading, booking) {
      let travelled = odometerReading - Number(booking.car.travelled || 0);

      let days =$scope.calculateDuration(booking.car.startDate,booking.car.endDate);
      console.log("days",days);
      let cost =
        travelled * Number(booking.car.pricePerKm) +
        Number(booking.car.basePrice) * days;
      return [travelled, cost];
    };

    /**
     * @description - Calculate duration between two dates in days
     * @param {Date|string} startDate
     * @param {Date|string} endDate
     * @returns {number} Number of days
     */
    $scope.calculateDuration = function (startDate, endDate) {
      if (!startDate || !endDate) return 0;

      let start = new Date(startDate);
      let end = new Date(endDate);

      let diffTime = Math.abs(end - start);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays || 1; // At least 1 day
    };

    /**
     * @description - Open invoice modal using the invoiceModal component
     * @param {Object} booking
     */
    $scope.openInvoice = function (booking) {
      let duration=$scope.calculateDuration(booking.car.startDate,booking.car.endDate);
      let baseAmount = booking.car.basePrice * duration;
      let distanceAmount =
        (booking.distanceTravelled || 0) * booking.car.pricePerKm;
      let subtotal = booking.totalAmount;
      let totalAmount = subtotal;

      // Open modal with UI Bootstrap
      let modalInstance = $uibModal.open({
        component: "invoiceModal",
        backdrop: "static", // Prevents closing on click outside
        size: "lg", // Large modal
        resolve: {
          // Pass all data to the modal component
          booking: function () {
            return booking;
          },
          invoiceDate: function () {
            return new Date();
          },
          duration: function () {
            return duration;
          },
          baseAmount: function () {
            return baseAmount;
          },
          distanceAmount: function () {
            return distanceAmount;
          },
          subtotal: function () {
            return subtotal;
          },
          totalAmount: function () {
            return totalAmount;
          },
        },
      });

      // Handle modal actions
      modalInstance.result.then(function () {
        // This runs when modal is dismissed
        console.log("Invoice modal dismissed");
      });
    };

    /**
     * @deprecated - No longer needed with UI Bootstrap modal
     * Use openInvoice instead which uses the invoiceModal component
     */
    $scope.closeInvoice = function (booking) {
      // This function is no longer needed as the modal has its own close functionality
      // Kept for backward compatibility
      booking.showInvoice = false;
    };
  },
]);
