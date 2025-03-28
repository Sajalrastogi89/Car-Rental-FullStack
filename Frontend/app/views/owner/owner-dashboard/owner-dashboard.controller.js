myApp.controller("OwnerDashboardController", [
  "$scope",
  "$q",
  "DashboardService",
  "ToastService",
  "IndexedDBService",
  "$uibModal",
  "BookingService",
  "CarService",
  function (
    $scope,
    $q,
    DashboardService,
    ToastService,
    IndexedDBService,
    $uibModal,
    BookingService,
    CarService
  ) {
    //hard coded things
    // Add these arrays to your controller

    $scope.sortOptions = [
      { value: "name", label: "Name" },
      { value: "basePrice", label: "Price" }
    ];

    // Initialize filter values
    $scope.fuelFilter = "";
    $scope.cityFilter = "";
    $scope.categoryFilter = "";
    $scope.sortOption = "name";

    $scope.cars = {}; // declaration and initialization of cars
    $scope.currentPageAll = 0; // current page number for pagination
    $scope.pageSize = 8; // number of cars fetched in each page
    $scope.isNextPageAvailable = true; // status for next page
    $scope.isPreviousPageAvailable = false; // status for previous page
    $scope.activeBookings = 0;
    /**
     * @description - runs when page will be loaded
     */

    $scope.init = function () {
      async.parallel(
        {
          cars: function (callback) {
            DashboardService.getCars()
              .then(function (allCars) {
                callback(null, allCars);
              })
              .catch(function (err) {
                callback(err);
              });
          },
          bookings: function (callback) {
            BookingService.getBookingsCount()
              .then(function (acceptedBookings) {
                callback(null, acceptedBookings);
              })
              .catch(function (err) {
                callback(err);
              });
          },
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
        },
        function (err, results) {
          if (err) {
            ToastService.error("Error loading dashboard data", 3000);
            console.error("Dashboard loading error:", err);
          } else {
            // Process results
            console.log("parallel completed",results);
            $scope.cars = results.cars.cars || [];
            $scope.cities = results.cities.cities || [];
            $scope.categories = results.categories.categories || [];
            $scope.fuelTypes = results.fuelTypes.fuelTypes || [];

            // Handle the bookings map returned by getAcceptedBookings
            const bookingsGroupArray = results.bookings.data;

            // Update scope with booking data
            $scope.totalCars = $scope.cars.length || 0;
            $scope.activeBookings = bookingsGroupArray[0].count+bookingsGroupArray[1].count;
            $scope.paidBookings = bookingsGroupArray[0].count;
            $scope.unpaidBookings = bookingsGroupArray[1].count;
            $scope.totalRevenue = bookingsGroupArray[0].totalRevenue + bookingsGroupArray[1].totalRevenue;
          }
        }
      );
    };


    $scope.openBookingsModal = function(car){
      console.log("car", car);
      BookingService.getBookingsByCarId(car._id).then(
        (allBookings)=>{
          console.log("allBookings", allBookings);
          let modalInstance = $uibModal.open({
            animation: true,
            component: 'bookingDetailsModal',
            resolve: {
              dataObject: function () {
                return allBookings; 
              },
            },
          });
    
          // Handle modal close event
          modalInstance.result.then(
            function (response) {
              console.log("Modal closed with response:", response);
            },
            function () {
              console.log("Modal dismissed.");
            }
          );
        }).catch((e)=>{
          console.error(e);
      })
    }


    /**
     * Opens a confirmation modal before deleting a car
     * @param {Object} car - The car object to be deleted
     */
    $scope.openDeleteWarnModal = function(car) {
      let modalInstance = $uibModal.open({
        component: 'deleteAlertModal',
        backdrop: 'static',
        size: 'md',
        resolve: {
          car: function() {
            return car;
          }
        }
      });
      
      modalInstance.result.then(function(result) {
        // Only proceed if confirmed is true
        if (result && result.confirmed) {
          // Show loading indicator for specific car
          car.isDeleting = true;
          // Call your service to delete the car
          CarService.deleteCar(car._id)
            .then(function() {
              // Success - remove the car from the array directly
              $scope.cars = $scope.cars.filter(function(c) {
                return c._id !== car._id;
              });

                
              // Update total cars count
              $scope.totalCars = $scope.cars.length || 0;
              
              // Show success message
              ToastService.success("Car deleted successfully", 3000);
            })
            .catch(function(error) {
              console.error("Error deleting car:", error);
              ToastService.error("Failed to delete car", 3000);
            })
            .finally(function() {
              // Remove loading indicator
              car.isDeleting = false;
            });
        }
      });
    };



    /**
     * Opens a modal to edit car price
     * @param {Object} car - The car object to edit
     */
    $scope.openEditCarModel = function(car) {
      // Create a copy of the car's price for editing
      let editData = {
        car: car,
        newPrice: car.basePrice
      };
      
      let modalInstance = $uibModal.open({
        component: 'editCarPriceModal',
        backdrop: 'static',
        size: 'md',
        resolve: {
          car: function() {
            return car;
          },
          newPrice: function() {
            return car.basePrice; // Initialize with current price
          }
        }
      });
      
      modalInstance.result.then(function(result) {
        if (result && result.success) {
          // Create updated car object with new price
          let updatedCar = {id: car._id,
                            carName: result.name,
                            basePrice: result.basePrice,
                            pricePerKm: result.pricePerKm,
                            outStationPrice: result.outStationPrice,
                            finePercentage: result.finePerDay
          };
          
          
          // Update the car in IndexedDB
          IndexedDBService.updateRecord("cars", updatedCar)
            .then(function() {
              // Update the car in the local array
              car.basePrice = result.updatedPrice;
              ToastService.success("Car price updated successfully", 3000);
            })
            .catch(function(error) {
              console.error("Error updating car price:", error);
              ToastService.error("Failed to update car price", 3000);
            });
        }
      });
    };

  },
]);
