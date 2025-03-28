myApp.service('CarService', ["$http","$q",function($http,$q) {



  this.addCarData = function (car) {
    let deferred = $q.defer();
    
    // Configure $http to not set Content-Type when sending FormData
    let config = {};
    if (car instanceof FormData) {
      config = {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      };
    }
    
    $http.post("http://localhost:8000/api/car/addCar", car, config)
      .then((response) => {
        deferred.resolve(response.data);
      })
      .catch((error) => {
        deferred.reject(error);
      });
    return deferred.promise;
  }

  this.getCars = function (params) {
    let deferred = $q.defer();
    console.log("current city in get cars", params);
    // Configure request with params and credentials in a single config object
    const config = {
      params
    };
    console.log("params", params);
    $http.get("http://localhost:8000/api/car/getCars", config)
      .then((response) => {
        console.log("Response from get cars", response);
        let carsData=response.data;
        carsData.cars.forEach((car) => {
          const fuelData = this.getFuelPumpData(car.fuelType);
          car.fuelPump = fuelData.icon;
          car.fuelPumpStyle = fuelData.style;
        });

        deferred.resolve(response.data);
      })
      .catch((error) => {
        console.error("Error fetching cars:", error);
        deferred.reject(error);
      });
    
    return deferred.promise;
  };

  this.getCar = function(id) {
    let deferred = $q.defer();
    console.log("car service");
    $http.get(`http://localhost:8000/api/car/carId/${id}`)
      .then((response) => {
        console.log("Response car id", response);
        deferred.resolve(response.data);
      })
      .catch((error) => {
        deferred.reject(error);
      });
    return deferred.promise;
  };


  this.deleteCar = function(id) {
    let deferred = $q.defer();
    $http.post(
      `http://localhost:8000/api/car/deleteCar/${id}`,
      {}
    ).then((response) => {
      deferred.resolve(response.data);
    }).catch((error) => {
      deferred.reject(error);
    });
  
    return deferred.promise;
  }
  


  this.getBookedDates = function(id) {
    let deferred = $q.defer();
    console.log("booked dates service");
    $http.get(`http://localhost:8000/api/booking/bookedDates/${id}`)
      .then((response) => {
        console.log("Response booked dates", response);
        deferred.resolve(response.data);
      })
      .catch((error) => {
        deferred.reject(error);
      });
    return deferred.promise;
  }

}]);