myApp.controller("UserController", [
  "$scope",
  "LocationFactory",
  "ToastService",
  "$q",
  "DashboardService",
  function (
    $scope,
    LocationFactory,
    ToastService,
    $q,
    DashboardService
  ) {
    $scope.cities = [
      "Delhi",
      "Mumbai",
      "Bengaluru",
      "Chennai",
      "Kolkata",
      "Hyderabad",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Chandigarh",
      "Lucknow",
      "Kochi",
      "Bhopal",
      "Indore",
      "Surat",
      "Agra",
      "Patna",
      "Vadodara",
      "Goa",
      "Shimla",
      "Rishikesh",
      "Manali",
      "Mussoorie",
      "Coimbatore",
      "Tiruchirappalli",
      "Jodhpur",
      "Udaipur",
      "Mysore",
      "Varanasi",
    ];



    $scope.searchText = '';
    $scope.fuelFilter = '';
    $scope.categoryFilter = '';
    $scope.selectedCity = ""; // declaration and initialization for selected city
    $scope.sortValue = "basePrice"; // default value for sorting fetched data using orderBy: basePrice
    $scope.carsInSelectedCity = []; // declaration and initialization of cars in selected city



    $scope.currentPage = 1; // Used in pagination and represents start page number
    $scope.isNextPageAvailable = true; // default value for next page availability
    $scope.isPreviousPageAvailable = false; // default value for previous page unavailability
    pageSize=8; // Numbers of cars in each page


  

    // Add sort options similar to owner dashboard
    $scope.sortOptions = [
      { value: "basePrice", label: "Price: Low to High" },
      { value: "-basePrice", label: "Price: High to Low" },
      { value: "name", label: "Name (A-Z)" },
      { value: "travelled", label: "Kilometers Travelled" }
    ];
    $scope.sortOption = "basePrice"; // Default sort

    // Get categories and fuel types for filters
    $scope.categories = ["Sedan", "SUV", "Hatchback", "Luxury", "Convertible"];
    $scope.fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"];


    $scope.currentPage = 1;
    $scope.pageSize = 9;

    /**
     * @description fetch current city and then fetch cars in that city using async.waterfall
     */
    $scope.init = function () {
      $scope.isLoading = true;
      async.waterfall(
        [
          function (callback) {
            getCurrentCity()
              .then((city) => {
                $scope.selectedCity = city;
                callback(null, city);
              })
              .catch((error) => callback(error));
          },
          function (city, callback) {
            $scope
              .getCarsInSelectedCity(city, $scope.currentPageAll)
              .then((cars) => {
                callback(null, cars);
              })
              .catch((error) => callback(error));
          },
        ],
        function (err, result) {
          if (err) {
            $scope.isLoading = false;
            ToastService.error(err,3000);
          } else {
            $scope.carsInSelectedCity = result;
            $scope.isLoading = false;
          }
        }
      );
    };

    /**
     * @description Get cars according to selected city
     * @param {String} city - current city by location or selected city
     * @param {Number} currentPage - for pagination
     * @returns {Promise} - returns a promise that resolves to the list of cars of page size
     */
    $scope.getCarsInSelectedCity = function (city, currentPage) {
      const deferred = $q.defer();
      DashboardService.getCarsData(
        "cars",
        "city",
        city,
        pageSize,
        currentPage
      )
        .then((cars) => {
          $scope.isPreviousPageAvailable = currentPage > 0;
          $scope.isNextPageAvailable = cars.length == 6;
          deferred.resolve(cars);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    /**
     * @description This function is using location factory to get current city
     * @returns {Promise} - returns a promise that resolves to the current city
     */
    let getCurrentCity = function () {
      const deferred = $q.defer();
      LocationFactory.getCityUsingGeolocation()
        .then((current) => {
          if (!$scope.cities.includes(current)) {
            return deferred.reject("Service not available");
          }
          return deferred.resolve(current);
        })
        .catch((error) => {
          return deferred.reject(error);
        });
      return deferred.promise;
    };

    /**
     * @description - This function is used in pagination for fetching cars in selected city in pages
     * @param {Number} currentPage - This number helps in skipping records using advance operation of indexed db
     */
    $scope.getNextSetOfCars = function (currentPage) {
      $scope.isLoading=true;
      $scope.currentPageAll = currentPage;
      $scope
        .getCarsInSelectedCity($scope.selectedCity, currentPage)
        .then((car) => {
          $scope.carsInSelectedCity = car;
        })
        .catch((e) => {
          ToastService.error(e,3000);
        })
        .finally(()=>{
          $scope.isLoading=false;
        })
    };

    /**
     * @description Filters cars based on the selected city
     */
    $scope.filterCarUsingSelectedCity = function () {
      $scope.isLoading=true;
      $scope.currentPageAll = 0;
      $scope
        .getCarsInSelectedCity($scope.selectedCity, $scope.currentPageAll)
        .then((cars) => {
          $scope.carsInSelectedCity = cars;
        })
        .catch((e) => {
          ToastService.error(e.message,3000);
        })
        .finally(()=>{
          $scope.isLoading=false;
        })
    };

  },
]);
