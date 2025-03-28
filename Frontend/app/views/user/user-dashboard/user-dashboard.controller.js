myApp.controller("UserController", [
  "$scope",
  "LocationFactory",
  "ToastService",
  "$q",
  "DashboardService",
  function ($scope, LocationFactory, ToastService, $q, DashboardService) {
   

    $scope.searchText = "";
    $scope.fuelFilter = "";
    $scope.selectedCity = ""; // declaration and initialization for selected city
    $scope.categoryFilter = "";
    $scope.sortValue = "basePrice"; // default value for sorting fetched data using orderBy: basePrice


    $scope.totalItems = 10;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    
    $scope.pageChanged = function () {
      console.log("Page changed to:", $scope.currentPage);
      // Fetch new data based on currentPage
    };
    
  

    // Add sort options similar to owner dashboard
    $scope.sortOptions = [
      { value: "basePrice", label: "Price: Low to High" },
      { value: "carName", label: "Name (A-Z)" },
      { value: "travelled", label: "Kilometers Travelled" },
    ];
    $scope.sortOption = "basePrice"; // Default sort

    // Get categories and fuel types for filters
    $scope.fuelTypes;
    $scope.cities;
    $scope.categories;
    $scope.carsInSelectedCity; // declaration and initialization of cars in selected city

    /**
     * @description fetch current city and then fetch cars in that city using async.waterfall
     */
    $scope.init = function () {
      $scope.isLoading = true;
      console.log("init");
      async.waterfall(
        [
          function (callback) {
            async.parallel(
              {
                cities: function (cb) {
                  DashboardService.getCities()
                    .then((cities) => {
                      cb(null, cities);
                    })
                },
                categories: function (cb) {
                  DashboardService.getCategories()
                    .then((categories) => {
                      cb(null, categories);
                    })
                },
                fuelTypes: function (cb) {
                  DashboardService.getFuelTypes()
                    .then((fuelTypes) => {
                      cb(null, fuelTypes);
                    })
                },
                currentCity: function (cb) {
                  DashboardService.getCurrentCity()
                    .then((currentCity) => {
                      console.log("current city 12", currentCity);
                      cb(null, currentCity);
                    })
                },
              },
              function (err, result) {
                if (err) {
                  console.log(1);
                  return callback(err);
                }
                console.log(2);
                callback(null, result);
              }
            );
          },
          function (values, callback) {
            let findObject={};
            if(values.currentCity) findObject.city=values.currentCity;
            DashboardService.getCars(findObject)
              .then((cars) => {
                let finalResult = {
                  cities: values.cities,
                  categories: values.categories,
                  fuelTypes: values.fuelTypes,
                  currentCity: values.currentCity,
                  cars: cars,
                };
                callback(null, finalResult);
              })
          },
        ],
        function (err, result) {
          if (err) {
            $scope.isLoading = false;
            ToastService.error(err, 3000);
          } else {
            console.log("result", result);
            $scope.carsInSelectedCity = result.cars.cars;
            $scope.fuelTypes = result.fuelTypes.fuelTypes;
            $scope.cities = result.cities.cities;
            $scope.categories = result.categories.categories;
            $scope.selectedCity = result.currentCity.charAt(0).toUpperCase() + result.currentCity.slice(1).toLowerCase();
            $scope.isLoading = false;
          }
        }
      );
    };


    $scope.getCarsData = function(){

      let params={};
      if($scope.search) params.carName=$scope.search;
      if($scope.fuelFilter) params.fuelType=$scope.fuelFilter;
      if($scope.categoryFilter) params.category=$scope.categoryFilter;
      if($scope.selectedCity) params.city=$scope.selectedCity;
      if($scope.sortOption) params.sortBy=$scope.sortOption;
      console.log("params",params);
      DashboardService.getCars(params)
        .then((response) => {
          $scope.carsInSelectedCity = response.cars;
        })
        .catch((error) => {
          ToastService.error(error, 3000);
        });
    }

  },
]);
