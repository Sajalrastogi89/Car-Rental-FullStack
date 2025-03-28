myApp.controller("AddCar", [
  "$scope",
  "IndexedDBService",
  "ToastService",
  "DashboardService",
  function ($scope, IndexedDBService, ToastService,DashboardService) {
    // Predefined categories of cars
    $scope.categories = ["Sedan", "SUV", "Hatchback", "Convertible"];
    $scope.availableFeatures = [
      'Air Conditioning', 
      'Power Steering',
      'Power Windows',
      'ABS',
      'Airbags',
      'Bluetooth',
      'Cruise Control',
      'Parking Sensors',
      'Backup Camera',
      'Sunroof'
    ];
    $scope.selectedFeatures = [];

    $scope.toggleFeature = function(feature) {
      let idx = $scope.selectedFeatures.indexOf(feature);
      
      // Is currently selected
      if (idx > -1) {
        $scope.selectedFeatures.splice(idx, 1);
      }
      // Is newly selected
      else if ($scope.selectedFeatures.length < 3) {
        $scope.selectedFeatures.push(feature);
      }
    };

    // Predefined fuel types
    $scope.fuelTypes = ["Petrol", "Diesel", "Electric"];

    // Predefined list of cities
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

    // Initialize car object
    $scope.car = {};
    $scope.onlyNumbers = "/^[1-9][0-9]*$/";

    /**
     * Handles image upload and converts it to a Blob
     * @param {*} element - The input element containing the file
     */
    $scope.uploadImage = function (element) {
      $scope.car.image=element.files[0];
    };

    // Form submission handler
    $scope.addCar = function () {
      const formData = new FormData();
    
      $scope.car.features=JSON.stringify($scope.selectedFeatures);
     
      for (const key in $scope.car) {
        console.log("key",key,$scope.car[key]);
          formData.append(key, $scope.car[key]);
      }
      console.log("FormData contents:");
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1]));
      }
      // Add car record to IndexedDB
      DashboardService.addCarData(formData)
        .then(() => {
          $scope.car = {}; // Reset car object
          ToastService.success("Car added successfully",3000); // Show success toast
        })
        .catch((e) => {
          ToastService.error(e,3000); // Show error toast
        });
    };
  },
]);
