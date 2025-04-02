/**
 * @description Owner Analysis Controller - Manages analytics dashboard for car owners
 * Handles data visualization, date range filtering, and chart rendering
 */
myApp.controller("OwnerAnalysisController", [
  "$scope",
  "$http",
  "$q",
  "$timeout",
  function ($scope, $http, $q, $timeout) {
    // ==========================================
    // State Management
    // ==========================================
    
    /**
     * @type {Object}
     * @description Analytics data from the server
     */
    $scope.analytics = null;
    
    /**
     * @type {Object}
     * @description Date range for filtering analytics
     */
    $scope.dateRange = {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      endDate: new Date()
    };
    
    /**
     * @type {boolean}
     * @description Loading state indicator
     */
    $scope.isLoading = false;

    // ==========================================
    // Initialization
    // ==========================================
    
    /**
     * @description Initialize the analytics dashboard
     * Triggers initial data load
     */
    $scope.init = function() {
      $scope.isLoading = true;
      $scope.loadAnalytics();
    };

    // ==========================================
    // Data Loading
    // ==========================================
    
    /**
     * @description Load analytics data based on current date range
     * Fetches data from server and triggers chart rendering
     */
    $scope.loadAnalytics = function() {
      const formattedStartDate = formatDateForAPI($scope.dateRange.startDate);
      const formattedEndDate = formatDateForAPI($scope.dateRange.endDate);
      
      $http.get(`http://localhost:8000/api/analysis/owner?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(response => {
          if (response.data.success) {
            $scope.analytics = response.data.data;
            $scope.renderCharts();
          } else {
            $scope.error = "Failed to load analytics data.";
          }
        })
        .catch(error => {
          $scope.error = "An error occurred while fetching analytics data.";
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Format a date object for API requests
     * @param {Date} date - The date to format
     * @returns {string} Formatted date string in YYYY-MM-DD format
     * @private
     */
    function formatDateForAPI(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    }

    // ==========================================
    // Chart Rendering
    // ==========================================
    
    /**
     * @description Render all analytics charts
     * Checks for data availability and renders each chart type
     */
    $scope.renderCharts = function() {
      if (!$scope.analytics) return;

      $timeout(function() {
        // Revenue Charts
        if ($scope.analytics.topCategories?.length > 0) {
          $scope.renderChart(
            "topCategories",
            $scope.analytics.topCategories[0].labels,
            $scope.analytics.topCategories[0].values,
            "bar",
            "Top Revenue Categories"
          );
        }
        
        if ($scope.analytics.topEarningCities?.length > 0) {
          $scope.renderChart(
            "topEarningCities",
            $scope.analytics.topEarningCities[0].labels,
            $scope.analytics.topEarningCities[0].values,
            "pie",
            "Top Earning Cities"
          );
        }
        
        // Usage Charts
        if ($scope.analytics.topTravelledCities?.length > 0) {
          $scope.renderChart(
            "topTravelledCities",
            $scope.analytics.topTravelledCities[0].labels,
            $scope.analytics.topTravelledCities[0].values,
            "pie",
            "Most Travelled Cities (km)"
          );
        }
        
        if ($scope.analytics.topTravelledCategories?.length > 0) {
          $scope.renderChart(
            "topTravelledCategories",
            $scope.analytics.topTravelledCategories[0].labels,
            $scope.analytics.topTravelledCategories[0].values,
            "bar",
            "Distance Travelled by Car Category (km)"
          );
        }
        
        // Booking Charts
        if ($scope.analytics.topBookedCars?.length > 0) {
          $scope.renderChart(
            "topBookedCars",
            $scope.analytics.topBookedCars[0].labels,
            $scope.analytics.topBookedCars[0].values,
            "bar",
            "Most Booked Cars"
          );
        }
        
        if ($scope.analytics.bookingTrend?.length > 0) {
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

    /**
     * @description Update analytics when date range changes
     * Triggers a new data load with updated date range
     */
    $scope.updateDateRange = function() {
      $scope.isLoading = true;
      $scope.loadAnalytics();
    };

    // ==========================================
    // Chart Configuration
    // ==========================================
    
    /**
     * @type {Array}
     * @description Color palette for bar charts
     * @private
     */
    const barColors = [
      '#4BC0C0', '#9966FF', '#FF9F40', 
      '#C9CBCF', '#7AC36A', '#5A9BD4', '#CE0058'
    ];
    
    /**
     * @type {Array}
     * @description Color palette for pie charts
     * @private
     */
    const pieColors = [
      '#4BC0C0', '#9966FF', '#FF9F40', 
      '#C9CBCF', '#7AC36A', '#5A9BD4', '#CE0058'
    ];

    /**
     * @description Render a single chart with the specified configuration
     * @param {string} elementId - The DOM element ID for the chart
     * @param {Array} labels - Chart labels
     * @param {Array} values - Chart values
     * @param {string} chartType - Type of chart (bar, pie, line)
     * @param {string} chartTitle - Title of the chart
     */
    $scope.renderChart = function(elementId, labels, values, chartType, chartTitle) {
      let ctx = document.getElementById(elementId);
      
      if (!ctx) {
        console.error(`Canvas element with ID ${elementId} not found`);
        return;
      }
      
      ctx = ctx.getContext("2d");
      
      // Select color palette based on chart type
      let colors = chartType === 'pie' ? pieColors : barColors;
      
      // Extend colors array if needed
      if (labels.length > colors.length) {
        colors = Array(Math.ceil(labels.length / colors.length))
          .fill(colors)
          .flat()
          .slice(0, labels.length);
      }

      // Configure chart data
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

      // Configure chart options
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
                
                let value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
                
                // Format value based on chart type
                if (elementId === 'topEarningCities' || elementId === 'topCategories') {
                  label += '₹' + value.toLocaleString();
                } else if (elementId === 'topTravelledCities' || elementId === 'topTravelledCategories') {
                  label += value.toLocaleString() + ' km';
                } else {
                  label += value;
                }
                
                return label;
              }
            }
          }
        }
      };

      // Clean up existing chart instance
      if (window.chartInstances && window.chartInstances[elementId]) {
        window.chartInstances[elementId].destroy();
      }
      
      // Create and store new chart instance
      if (!window.chartInstances) window.chartInstances = {};
      window.chartInstances[elementId] = new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: chartOptions,
      });
    };

    // Initialize controller
    $scope.init();
  }
]);