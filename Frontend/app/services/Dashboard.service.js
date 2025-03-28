myApp.service("DashboardService", [
  "$q",
  "LocationFactory",
  "$http",
  function ($q,LocationFactory, $http) {




    this.getCategories = function () {
      let deferred = $q.defer();

      $http
        .get("http://localhost:8000/api/field/getCategories")
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };



    this.getFuelTypes = function () {
      let deferred = $q.defer();

      $http
        .get("http://localhost:8000/api/field/getFuelTypes",
         )
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };



    this.getCities = function () {
      let deferred = $q.defer();

      $http
        .get("http://localhost:8000/api/field/getCities"
          )
        .then((response) => {
          deferred.resolve(response.data);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };


    this.getCurrentCity = function () {
      const deferred = $q.defer();
      LocationFactory.getCityUsingGeolocation()
        .then((current) => {
          return deferred.resolve(current);
        })
        .catch((error) => {
          return deferred.reject(error);
        });
      return deferred.promise;
    };



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



    /**
     * @description - this will set fuel related data according to fuel value
     * @param {String} fuelType
     * @returns {Object}
     */
    this.getFuelPumpData = function (fuelType) {
      return fuelType == "Electric"
        ? {
            icon: "assets/img/electric.png",
            style: { width: "66%", opacity: 0.9 },
          }
        : { icon: "assets/img/fuel.png", style: {} };
    };



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

  },
]);
