myApp.controller("OwnerAnalysisController", [
  "$scope",
  "IndexedDBService",
  "$q",
  "$timeout",
  function ($scope, IndexedDBService, $q, $timeout) {
    $scope.init = function () {
      $scope.isLoading = true;
      ownerCompletedBookings().then((allCompletedBookings) => {
        console.log("allCompletedBookings",allCompletedBookings);
        // Calculate all metrics
        let earningPerCarCategory = calculateEarningPerCategory(allCompletedBookings);
        let earningPerCity = calculateEarningPerCity(allCompletedBookings);
        let travelPerCarCategory = calculateTravelPerCategory(allCompletedBookings);
        let travelPerCity = calculateTravelPerCity(allCompletedBookings);
        let highestBidCategoryPerCity = calculateHighestBidCategoryPerCity(allCompletedBookings);
        let highestTravelledCategoryPerCity = calculateHighestTravelledCategoryPerCity(allCompletedBookings);
        console.log("earningPerCarCategory",earningPerCarCategory);
        // Use $timeout to ensure DOM is ready before rendering charts
        $timeout(function() {
          // Render all charts
          $scope.renderChart(
            "earningPerCarCategory",
            Object.keys(earningPerCarCategory),
            Object.values(earningPerCarCategory),
            "bar",
            "Earnings per Car Category"
          );
          
          $scope.renderChart(
            "earningPerCity",
            Object.keys(earningPerCity),
            Object.values(earningPerCity),
            "pie",
            "Earnings per City"
          );
          
          $scope.renderChart(
            "travelPerCarCategory",
            Object.keys(travelPerCarCategory),
            Object.values(travelPerCarCategory),
            "bar",
            "Distance Traveled per Car Category"
          );
          
          $scope.renderChart(
            "travelPerCity",
            Object.keys(travelPerCity),
            Object.values(travelPerCity),
            "pie",
            "Distance Traveled per City"
          );
          
          $scope.renderChart(
            "highestBidCategoryPerCity",
            Object.keys(highestBidCategoryPerCity),
            Object.values(highestBidCategoryPerCity),
            "bar",
            "Highest Bid Car Category per City"
          );
          
          $scope.renderChart(
            "highestTravelledCategoryPerCity",
            Object.keys(highestTravelledCategoryPerCity),
            Object.values(highestTravelledCategoryPerCity),
            "pie",
            "Highest travelled Car Category per City"
          );
          
          $scope.isLoading = false;
        }, 0); // Small delay to ensure DOM elements are ready
      })
      .catch((e) => {
        console.error(e);
        $scope.isLoading = false;
      });
    };

    let calculateEarningPerCategory = function(allCompletedBookings) {
      let earning = {};
      allCompletedBookings.forEach((booking) => {
        if(!earning[booking.car.category]) {
          earning[booking.car.category] = 0;
        }
        earning[booking.car.category] += booking.totalAmount;
      });
      return earning;
    };

    let calculateEarningPerCity = function(allCompletedBookings) {
      let earning = {};
      allCompletedBookings.forEach((booking) => {
        if(!earning[booking.car.city]) {
          earning[booking.car.city] = 0;
        }
        earning[booking.car.city] += booking.totalAmount;
      });
      return earning;
    };

    let calculateTravelPerCategory = function(allCompletedBookings) {
      let travel = {};
      allCompletedBookings.forEach((booking) => {
        if(!travel[booking.car.category]) {
          travel[booking.car.category] = 0;
        }
        travel[booking.car.category] += booking.distanceTravelled;
      });
      return travel;
    };

    let calculateTravelPerCity = function(allCompletedBookings) {
      let travel = {};
      allCompletedBookings.forEach((booking) => {
        if(!travel[booking.car.city]) {
          travel[booking.car.city] = 0;
        }
        travel[booking.car.city] += booking.distanceTravelled;
      });
      return travel;
    };

    let calculateHighestBidCategoryPerCity = function(allCompletedBookings) {
      let categoryPerCity = {};
      
      allCompletedBookings.forEach((booking) => {
        const city = booking.car.city;
        const category = booking.car.category;
        
        if (!categoryPerCity[city]) {
          categoryPerCity[city] = {};
        }
        
        if (!categoryPerCity[city][category]) {
          categoryPerCity[city][category] = 0;
        }
        
        categoryPerCity[city][category] += booking.totalAmount;
      });
      
      let highestEarningCategories = {};
      
      Object.keys(categoryPerCity).forEach((city) => {
        let highestAmount = 0;
        let highestCategory = "";
        
        Object.keys(categoryPerCity[city]).forEach((category) => {
          if (categoryPerCity[city][category] > highestAmount) {
            highestAmount = categoryPerCity[city][category];
            highestCategory = category;
          }
        });
        
        highestEarningCategories[city + " " + highestCategory] = highestAmount;
      });
      
      return highestEarningCategories;
    };

    let calculateHighestTravelledCategoryPerCity = function(allCompletedBookings) {
      let categoryPerCity = {};
      
      allCompletedBookings.forEach((booking) => {
        const city = booking.car.city;
        const category = booking.car.category;
        
        if (!categoryPerCity[city]) {
          categoryPerCity[city] = {};
        }
        
        if (!categoryPerCity[city][category]) {
          categoryPerCity[city][category] = 0;
        }
        
        categoryPerCity[city][category] += booking.distanceTravelled;
      });
      
      let highestTravelledCategories = {};
      
      Object.keys(categoryPerCity).forEach((city) => {
        let highestTravelled = 0;
        let highestCategory = "";
        
        Object.keys(categoryPerCity[city]).forEach((category) => {
          if (categoryPerCity[city][category] > highestTravelled) {
            highestTravelled = categoryPerCity[city][category];
            highestCategory = category;
          }
        });
        
        highestTravelledCategories[city + " " + highestCategory] = highestTravelled;
      });
      
      return highestTravelledCategories;
    };

    let ownerCompletedBookings = function() {
      let deferred = $q.defer();
      
      let owner = JSON.parse(sessionStorage.getItem("loginData"));
      let owner_id = owner.id;
      
      IndexedDBService.getRecordsUsingIndex("biddings", "owner_id", owner_id)
      .then((allBookings) => {
        let allCompletedBookings = allBookings.filter((booking) => {
          return booking.status === 'accepted' && booking.paymentStatus;
        });
        deferred.resolve(allCompletedBookings);
      })
      .catch((e) => {
        deferred.reject(e);
      });
      
      return deferred.promise;
    };

    // Fixed color palettes
    const barColors = [
      '#4BC0C0', '#9966FF', '#FF9F40', 
      '#C9CBCF', '#7AC36A', '#5A9BD4', '#CE0058'
    ];
    
    const pieColors = [
      '#4BC0C0', '#9966FF', '#FF9F40', 
      '#C9CBCF', '#7AC36A', '#5A9BD4', '#CE0058'
    ];

    $scope.renderChart = function(elementId, categories, values, chartType, chartLabel) {
      let ctx = document.getElementById(elementId);
      
      if (!ctx) {
        console.error(`Canvas element with ID ${elementId} not found`);
        return;
      }
      
      ctx = ctx.getContext("2d");
      
      // Use different color sets based on chart type
      let colors = chartType === 'pie' ? pieColors : barColors;
      
      // Ensure we have enough colors for all categories
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
            display: chartType === 'bar',
          }
        },
        plugins: {
          legend: {
            display: chartType === 'pie',
            position: 'top',
          },
          title: {
            display: true,
            text: chartLabel
          }
        }
      };

      // Check if a chart instance already exists for this canvas
      if (window.chartInstances && window.chartInstances[elementId]) {
        window.chartInstances[elementId].destroy();
      }
      
      // Create chart instance and store reference
      if (!window.chartInstances) window.chartInstances = {};
      window.chartInstances[elementId] = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options,
      });
    };
  }
]);