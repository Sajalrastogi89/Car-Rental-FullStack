myApp.service("BookingService", ["$http", "$q", function ($http, $q) {

  this.getAllBookings = function () {
    let deferred = $q.defer();
    $http.get("http://localhost:8000/api/booking/getAllBookings").then((response) => {
      deferred.resolve(response.data);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }

  this.getBookingsCount = function () {
    let deferred = $q.defer();
    $http.get("http://localhost:8000/api/analysis/booking-count").then((response) => {
      deferred.resolve(response.data);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }

  this.getBookingsByCarId = function (carId) {
    let deferred = $q.defer();
    $http.get(`http://localhost:8000/api/booking/getBookingsByCarId/${carId}`).then((response) => {
      console.log("response", response);
      deferred.resolve(response.data);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }


  this.updateStartOdometer = function (bookingId, odometerValue, odometerType, carId ) {
    let deferred = $q.defer();
    let updateObject = {
      bookingId,
      odometerValue,
      odometerType,
      carId
    };
    console.log("updateObject", updateObject);
    $http.patch(`http://localhost:8000/api/booking/updateBooking/${bookingId}`,  updateObject ).then((response) => {
      console.log("response", response);
      deferred.resolve(response.data);
    }).catch((error) => {
      deferred.reject(error);
    });
    return deferred.promise;
  }

}
]);