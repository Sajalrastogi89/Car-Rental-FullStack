myApp.controller("OwnerDashboardController", [
  "$scope",
  "$q",
  "DashboardService",
  "ToastService",
  "IndexedDBService",
  "$uibModal",
  function (
    $scope,
    $q,
    DashboardService,
    ToastService,
    IndexedDBService,
    $uibModal
  ) {
    //hard coded things
    // Add these arrays to your controller
    $scope.fuelTypes = ["Petrol", "Diesel", "Electric"];
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
    $scope.categories = [
      "Sedan",
      "SUV",
      "Hatchback",
      "Luxury",
      "Convertible",
      "Sports",
    ];
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
    $scope.owner_id = JSON.parse(sessionStorage.getItem("loginData")).id;
    /**
     * @description - runs when page will be loaded
     */

    $scope.init = function () {
      async.parallel(
        {
          cars: function (callback) {
            getCars($scope.currentPageAll)
              .then(function (allCars) {
                callback(null, allCars);
              })
              .catch(function (err) {
                callback(err);
              });
          },
          bookings: function (callback) {
            getAcceptedBookings($scope.owner_id)
              .then(function (acceptedBookings) {
                callback(null, acceptedBookings);
              })
              .catch(function (err) {
                callback(err);
              });
          },
        },
        function (err, results) {
          if (err) {
            ToastService.error("Error loading dashboard data", 3000);
            console.error("Dashboard loading error:", err);
          } else {
            // Process results
            console.log("parallel completed");
            $scope.cars = results.cars || [];

            // Handle the bookings map returned by getAcceptedBookings
            const bookingsMap = results.bookings;

            // Update scope with booking data
            $scope.totalCars = $scope.cars.length || 0;
            $scope.activeBookings = bookingsMap.totalCount;
            $scope.paidBookings = bookingsMap.paidCount;
            $scope.unpaidBookings = bookingsMap.unpaidCount;
            $scope.totalRevenue = bookingsMap.totalRevenue;
          }
        }
      );
    };

   

    /**
     * @description - this will fetch owner cars according to current page and page size
     * @param {Number} currentPage
     */
    let getCars = function (currentPage) {
      let deferred = $q.defer();
      const owner_id = JSON.parse(sessionStorage.getItem("loginData")).id;
      console.log("owner dashboard", owner_id);
      DashboardService.getCarsData(
        "cars",
        "owner_id",
        owner_id,
        $scope.pageSize,
        currentPage
      )
        .then((allCars) => {
          deferred.resolve(allCars);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    /**
     * @description - Get accepted bookings and categorize by payment status in a single reduce operation
     * @param {String} owner_id - Owner ID
     * @return {Promise} - Promise resolving to the bookings map
     */
    let getAcceptedBookings = function (owner_id) {
      let deferred = $q.defer();

      IndexedDBService.getRecordsUsingIndex("biddings", "owner_id", owner_id)
        .then((allBiddings) => {
          // Use reduce to create all three categories in one pass
          const bookingsMap = allBiddings.reduce(
            (result, bid) => {
              // Only process accepted bookings
              if (bid.status === "accepted") {
                // Add to allAcceptedBookings array
                result.allAcceptedBookings.push(bid);

                // Add to the appropriate payment status array
                if (bid.paymentStatus === true) {
                  result.paidBookings.push(bid);
                } else {
                  result.unpaidBookings.push(bid);
                }
              }
              return result;
            },
            {
              // Initialize the result object with empty arrays
              allAcceptedBookings: [],
              paidBookings: [],
              unpaidBookings: [],
            }
          );

          console.log("Bookings map from reduce:", bookingsMap);

          // Add summary stats to the map
          bookingsMap.totalCount = bookingsMap.allAcceptedBookings.length;
          bookingsMap.paidCount = bookingsMap.paidBookings.length;
          bookingsMap.unpaidCount = bookingsMap.unpaidBookings.length;

          // Calculate total revenue from paid bookings directly in this function
          bookingsMap.totalRevenue = bookingsMap.paidBookings.reduce(
            (total, booking) => {
              return total + parseInt(booking.totalAmount || 0);
            },
            0
          );

          deferred.resolve(bookingsMap);
        })
        .catch((e) => {
          console.error("Error fetching bookings:", e);
          deferred.reject(e);
        });

      return deferred.promise;
    };

    /**
     * @description - this will fetch next or previous set of cars on the basis of
     * page number
     */
    $scope.getNextSetOfCars = function (currentPage) {
      $scope.isLoading = true;
      $scope.currentPageAll = currentPage;
      getCars(currentPage)
        .then((car) => {
          $scope.isPreviousPageAvailable = currentPage > 0;
          $scope.isNextPageAvailable = car.length == 8;
          $scope.cars = car;
        })
        .catch(() => {
          ToastService.error("Unable to fetch cars", 3000);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };



    $scope.openBookingsModal = function(car){
      IndexedDBService.getRecordsUsingIndex("biddings","car_id",car.id).then(
        (allBiddings)=>{
          console.log("opening bids",allBiddings);
          allBiddings=allBiddings.filter((bid)=>{
            return bid.status==='accepted';
          })
          // console.log(allBiddings);
          // openModal(allBiddings,'bookingDetailsModal')
          let modalInstance = $uibModal.open({
            animation: true,
            component: 'bookingDetailsModal',
            resolve: {
              dataObject: function () {
                return allBiddings; // Passing car details to modal
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
        console.log("result",result);
        // Only proceed if confirmed is true
        if (result && result.confirmed) {
          // Show loading indicator for specific car
          car.isDeleting = true;
          console.log("isDeleting",car.isDeleting);
          // Call your service to delete the car
          IndexedDBService.deleteRecord("cars", car.id)
            .then(function() {
              console.log("success");
              // Success - remove the car from the array directly
              $scope.cars = $scope.cars.filter(function(c) {
                return c.id !== car.id;
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
          let updatedCar = {id: car.id,
                            basePrice: result.updatedPrice
          };
          
          updatedCar.basePrice = result.updatedPrice;
          
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
