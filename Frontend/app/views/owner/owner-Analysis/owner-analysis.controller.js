myApp.controller("OwnerAnalysisController", [
  "$scope",
  "$http",
  "$q",
  "$timeout",
  function ($scope, $http, $q, $timeout) {
    $scope.analytics = null;
    
    // Initialize with proper Date objects instead of strings
    $scope.dateRange = {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date()
    };
    
    $scope.isLoading = false;

    $scope.init = function () {
      $scope.isLoading = true;
      $scope.loadAnalytics();
    };

    $scope.loadAnalytics = function() {
      // Format dates for API call
      const formattedStartDate = formatDateForAPI($scope.dateRange.startDate);
      const formattedEndDate = formatDateForAPI($scope.dateRange.endDate);
      
      $http.get(`http://localhost:8000/api/analysis/owner?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(response => {
          if (response.data.success) {
            $scope.analytics = response.data.data;
            $scope.renderCharts();
          } else {
            console.error("Error loading analytics:", response.data.message);
            $scope.error = "Failed to load analytics data.";
          }
        })
        .catch(error => {
          console.error("API Error:", error);
          $scope.error = "An error occurred while fetching analytics data.";
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    // Helper function to format dates for API
    function formatDateForAPI(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    $scope.renderCharts = function() {
      // Make sure analytics data exists
      if (!$scope.analytics) return;

      $timeout(function() {
        // For each chart type in analytics data, render the appropriate chart
        if ($scope.analytics.topCategories && $scope.analytics.topCategories.length > 0) {
          $scope.renderChart(
            "topCategories",
            $scope.analytics.topCategories[0].labels,
            $scope.analytics.topCategories[0].values,
            "bar",
            "Top Revenue Categories"
          );
        }
        
        if ($scope.analytics.topEarningCities && $scope.analytics.topEarningCities.length > 0) {
          $scope.renderChart(
            "topEarningCities",
            $scope.analytics.topEarningCities[0].labels,
            $scope.analytics.topEarningCities[0].values,
            "pie",
            "Top Earning Cities"
          );
        }
        
        if ($scope.analytics.topTravelledCities && $scope.analytics.topTravelledCities.length > 0) {
          $scope.renderChart(
            "topTravelledCities",
            $scope.analytics.topTravelledCities[0].labels,
            $scope.analytics.topTravelledCities[0].values,
            "pie",
            "Most Travelled Cities (km)"
          );
        }
        
        if ($scope.analytics.topTravelledCategories && $scope.analytics.topTravelledCategories.length > 0) {
          $scope.renderChart(
            "topTravelledCategories",
            $scope.analytics.topTravelledCategories[0].labels,
            $scope.analytics.topTravelledCategories[0].values,
            "bar",
            "Distance Travelled by Car Category (km)"
          );
        }
        
        if ($scope.analytics.topBookedCars && $scope.analytics.topBookedCars.length > 0) {
          $scope.renderChart(
            "topBookedCars",
            $scope.analytics.topBookedCars[0].labels,
            $scope.analytics.topBookedCars[0].values,
            "bar",
            "Most Booked Cars"
          );
        }
        
        if ($scope.analytics.bookingTrend && $scope.analytics.bookingTrend.length > 0) {
          $scope.renderChart(
            "bookingTrend",
            $scope.analytics.bookingTrend[0].labels,
            $scope.analytics.bookingTrend[0].values,
            "line",
            "Booking Trend"
          );
        }
      }, 0);
    };

    // Date range filter
    $scope.updateDateRange = function() {
      $scope.isLoading = true;
      $scope.loadAnalytics();
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

    $scope.renderChart = function(elementId, labels, values, chartType, chartTitle) {
      let ctx = document.getElementById(elementId);
      
      if (!ctx) {
        console.error(`Canvas element with ID ${elementId} not found`);
        return;
      }
      
      ctx = ctx.getContext("2d");
      
      // Use different color sets based on chart type
      let colors = chartType === 'pie' ? pieColors : barColors;
      
      // Ensure we have enough colors for all data points
      if (labels.length > colors.length) {
        colors = Array(Math.ceil(labels.length / colors.length))
          .fill(colors)
          .flat()
          .slice(0, labels.length);
      }

      let chartData = {
        labels: labels,
        datasets: [{
          label: chartTitle,
          data: values,
          backgroundColor: chartType === 'line' ? 'rgba(75, 192, 192, 0.2)' : colors,
          borderColor: chartType === 'line' ? 'rgba(75, 192, 192, 1)' : colors,
          borderWidth: 1,
          tension: chartType === 'line' ? 0.1 : 0,
          fill: chartType === 'line'
        }]
      };

      let chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            display: chartType !== 'pie',
          }
        },
        plugins: {
          legend: {
            display: chartType === 'pie',
            position: 'top',
          },
          title: {
            display: true,
            text: chartTitle,
            font: {
              size: 16
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== undefined) {
                  if (elementId === 'topEarningCities' || elementId === 'topCategories') {
                    label += '₹' + context.parsed.y.toLocaleString();
                  } else if (elementId === 'topTravelledCities' || elementId === 'topTravelledCategories') {
                    label += context.parsed.y.toLocaleString() + ' km';
                  } else {
                    label += context.parsed.y;
                  }
                } else if (context.parsed !== undefined) {
                  if (elementId === 'topEarningCities' || elementId === 'topCategories') {
                    label += '₹' + context.parsed.toLocaleString();
                  } else if (elementId === 'topTravelledCities' || elementId === 'topTravelledCategories') {
                    label += context.parsed.toLocaleString() + ' km';
                  } else {
                    label += context.parsed;
                  }
                }
                return label;
              }
            }
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
        data: chartData,
        options: chartOptions,
      });
    };
  }
]);