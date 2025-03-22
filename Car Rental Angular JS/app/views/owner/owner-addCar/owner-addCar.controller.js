myApp.controller("AddCar", [
  "$scope",
  "IndexedDBService",
  "ToastService",
  function ($scope, IndexedDBService, ToastService) {
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
      let file = element.files[0]; // Get the uploaded file
      let fileType = file.type; // Get the file type

      let reader = new FileReader();
      reader.onload = function (event) {
        let arrayBuffer = event.target.result; // Get raw data
        $scope.car.image = new Blob([arrayBuffer], { type: fileType }); // Create valid Blob
      };

      reader.readAsArrayBuffer(file); // Read file as ArrayBuffer
    };

    // Form submission handler
    $scope.addCar = function () {

      $scope.car.features=$scope.selectedFeatures;
     
      // Get user data from session storage
      const user = JSON.parse(sessionStorage.getItem("loginData"));
      $scope.car.owner_id = user.email; // Set owner ID
      $scope.car.owner = user; // Set owner details

      // Add car record to IndexedDB
      IndexedDBService.addRecord("cars", $scope.car)
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
