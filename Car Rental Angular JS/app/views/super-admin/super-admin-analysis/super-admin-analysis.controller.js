myApp.controller("SuperAdminAnalysisController", [
  "$scope",
  "IndexedDBService",
  "$q",
  "$timeout",
  "$window",
  function ($scope, IndexedDBService, $q, $timeout, $window) {
    // Add pendingOwners to the scope
    $scope.pendingOwners = [];
    // Add this to your controller initialization
    $scope.showVerification = false; // Start with verification panel hidden

    $scope.init = function () {
      $scope.isLoading = true;

      $q.all({
        users: getAllUsers(),
        cars: getAllCars(),
        biddings: getAllBiddings(),
      })
        .then((results) => {
          // Extract data from results
          const users = results.users;
          const cars = results.cars;
          const biddings = results.biddings;

          // Check if we have data to display
          $scope.hasData =
            users.length > 0 || cars.length > 0 || biddings.length > 0;

          // Load pending owners
          $scope.loadPendingOwners();

          if ($scope.hasData) {
            // Process data for charts
            let usersPerRole = calculateUsersPerRole(users);
            let carsPerCity = calculateCarsPerCity(cars);
            let carsPerCategory = calculateCarsPerCategory(cars);
            let carsPerFuelType = calculateCarsPerFuelType(cars);
            let luxuryCars = calculateLuxuryCars(cars);
            let bidStatus = calculateBidStatus(biddings);

            // Use $timeout to ensure DOM is ready before rendering charts
            $timeout(function () {
              // Render all charts
              console.log(1);
              $scope.renderChart(
                "usersPerRoleChart",
                Object.keys(usersPerRole),
                Object.values(usersPerRole),
                "pie",
                "Users per Role"
              );

              $scope.renderChart(
                "carsPerCityChart",
                Object.keys(carsPerCity),
                Object.values(carsPerCity),
                "pie",
                "Cars per City"
              );

              $scope.renderChart(
                "carsPerCategoryChart",
                Object.keys(carsPerCategory),
                Object.values(carsPerCategory),
                "bar",
                "Cars per Category"
              );

              $scope.renderChart(
                "carsPerFuelTypeChart",
                Object.keys(carsPerFuelType),
                Object.values(carsPerFuelType),
                "pie",
                "Cars per Fuel Type"
              );

              $scope.renderChart(
                "luxuryCarsChart",
                Object.keys(luxuryCars),
                Object.values(luxuryCars),
                "bar",
                "Cars per Transmission Type"
              );

              $scope.renderChart(
                "bidStatusChart",
                Object.keys(bidStatus),
                Object.values(bidStatus),
                "bar",
                "Bid Status Distribution"
              );
            }, 100);
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    // Function to load pending owners
    $scope.loadPendingOwners = function () {
      IndexedDBService.getAll("users")
        .then(function (allUsers) {
          // Filter for owners with verified=false or undefined
          $scope.pendingOwners = allUsers.filter(function (user) {
            return (
              user.role === "owner" &&
              (user.verified === false || user.verified === undefined)
            );
          });
        })
        .catch(function (error) {
          ToastService.error("Error loading pending owners", 3000);
        });
    };

    // Function to verify an owner
    $scope.verifyOwner = function (owner) {
      owner.verified=true;
      IndexedDBService.updateRecord("users", owner)
        .then(function () {
          $scope.loadPendingOwners();
        })
        .catch(function (error) {
          ToastService.error("Error in verifying Owner",3000);
        });
    };

    // Function to reject an owner
    $scope.rejectOwner = function (ownerId) {
      if (
        $window.confirm(
          "Are you sure you want to reject this owner? Their account will be deleted."
        )
      ) {
        IndexedDBService.deleteRecord("users", ownerId)
          .then(function () {
            $window.alert("Owner account rejected and deleted");
            // Refresh the list
            $scope.loadPendingOwners();
          })
          .catch(function (error) {
            console.error("Error rejecting owner:", error);
            $window.alert("Failed to reject owner");
          });
      }
    };

    // Data fetching functions
    let getAllUsers = function () {
      let deferred = $q.defer();
      IndexedDBService.getAll("users")
        .then((users) => {
          deferred.resolve(users);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    let getAllCars = function () {
      let deferred = $q.defer();
      IndexedDBService.getAll("cars")
        .then((cars) => {
          deferred.resolve(cars);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    let getAllBiddings = function () {
      let deferred = $q.defer();
      IndexedDBService.getAll("biddings")
        .then((biddings) => {
          deferred.resolve(biddings);
        })
        .catch((e) => {
          deferred.reject(e);
        });
      return deferred.promise;
    };

    // Data processing functions
    let calculateUsersPerRole = function (users) {
      let roles = {};
      users.forEach((user) => {
        if (!roles[user.role]) {
          roles[user.role] = 0;
        }
        roles[user.role]++;
      });
      return roles;
    };

    let calculateCarsPerCity = function (cars) {
      let cities = {};
      cars.forEach((car) => {
        if (!cities[car.city]) {
          cities[car.city] = 0;
        }
        cities[car.city]++;
      });
      return cities;
    };

    let calculateCarsPerCategory = function (cars) {
      let categories = {};
      cars.forEach((car) => {
        if (!categories[car.category]) {
          categories[car.category] = 0;
        }
        categories[car.category]++;
      });
      return categories;
    };

    let calculateCarsPerFuelType = function (cars) {
      let fuelTypes = {};
      cars.forEach((car) => {
        if (!fuelTypes[car.fuelType]) {
          fuelTypes[car.fuelType] = 0;
        }
        fuelTypes[car.fuelType]++;
      });
      return fuelTypes;
    };

    let calculateLuxuryCars = function (cars) {
      let carStatus = {};
      cars.forEach((car) => {
        const type = car.basePrice < 1000 ? "Normal" : "Luxury";
        if (!carStatus[type]) {
          carStatus[type] = 0;
        }
        carStatus[type]++;
      });
      return carStatus;
    };

    let calculateBidStatus = function (biddings) {
      let statuses = {
        Pending: 0,
        Accepted: 0,
        Rejected: 0,
        Completed: 0,
      };

      biddings.forEach((bid) => {
        if (bid.status === "pending") {
          statuses["Pending"]++;
        } else if (bid.status === "accepted" && !bid.paymentStatus) {
          statuses["Accepted"]++;
        } else if (bid.status === "rejected") {
          statuses["Rejected"]++;
        } else if (bid.status === "accepted" && bid.paymentStatus) {
          statuses["Completed"]++;
        }
      });

      return statuses;
    };

    // Chart rendering function
    // Fixed color palettes
    const chartColors = [
      "#4BC0C0",
      "#FF6384",
      "#FFCE56",
      "#36A2EB",
      "#9966FF",
      "#FF9F40",
      "#C9CBCF",
      "#7AC36A",
    ];

    $scope.renderChart = function (
      elementId,
      categories,
      values,
      chartType,
      chartLabel
    ) {
      let ctx = document.getElementById(elementId);

      if (!ctx) {
        console.error(`Canvas element with ID ${elementId} not found`);
        return;
      }

      ctx = ctx.getContext("2d");

      // Ensure we have enough colors for all categories
      let colors = chartColors;
      if (categories.length > colors.length) {
        colors = Array(Math.ceil(categories.length / colors.length))
          .fill(colors)
          .flat()
          .slice(0, categories.length);
      }

      let data = {
        labels: categories,
        datasets: [
          {
            label: chartLabel,
            data: values,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 1,
          },
        ],
      };

      let options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            display: chartType === "bar",
          },
        },
        plugins: {
          legend: {
            display: chartType === "pie",
            position: "top",
          },
          title: {
            display: true,
            text: chartLabel,
          },
        },
      };

    
    };
  },
]);
