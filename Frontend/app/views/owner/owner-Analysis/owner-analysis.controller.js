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
            $scope.processAnalyticsData();
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
     * @description Process analytics data for visualization
     */
    $scope.processAnalyticsData = function() {
      // Process Trip Type Analysis
      if ($scope.analytics.tripTypeAnalysis) {
        $scope.tripTypeChartData = {
          labels: $scope.analytics.tripTypeAnalysis.map(item => item.tripType),
          values: $scope.analytics.tripTypeAnalysis.map(item => item.metrics.totalRevenue),
          bookings: $scope.analytics.tripTypeAnalysis.map(item => item.metrics.totalBookings),
          avgRevenue: $scope.analytics.tripTypeAnalysis.map(item => item.metrics.avgRevenue),
          avgDistance: $scope.analytics.tripTypeAnalysis.map(item => item.metrics.avgDistance)
        };
      }

      // Process Mileage Analysis
      if ($scope.analytics.mileageAnalysis) {
        $scope.mileageChartData = {
          labels: $scope.analytics.mileageAnalysis.map(item => item.carName),
          totalDistance: $scope.analytics.mileageAnalysis.map(item => item.metrics.totalDistance || 0),
          avgDistance: $scope.analytics.mileageAnalysis.map(item => item.metrics.avgDistance || 0)
        };
      }

      // Process Bidding Analysis
      if ($scope.analytics.biddingAnalysis && $scope.analytics.biddingAnalysis.length > 0) {
        $scope.biddingMetrics = $scope.analytics.biddingAnalysis[0].metrics;
      }
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
        // Remove old chart instances first
        if (window.chartInstances) {
          Object.keys(window.chartInstances).forEach(key => {
            window.chartInstances[key].destroy();
            delete window.chartInstances[key];
          });
        }

        // Top Categories Chart
        if ($scope.analytics.topCategories?.labels?.length > 0) {
          $scope.renderChart(
            'topCategories',
            $scope.analytics.topCategories.labels,
            [{
              label: 'Revenue by Category',
              data: $scope.analytics.topCategories.values,
              type: 'bar'
            }],
            'bar',
            'Top Revenue Categories'
          );
        }

        // Top Earning Cities Chart
        if ($scope.analytics.topEarningCities?.labels?.length > 0) {
          $scope.renderChart(
            'topEarningCities',
            $scope.analytics.topEarningCities.labels,
            [{
              data: $scope.analytics.topEarningCities.values
            }],
            'pie',
            'Top Earning Cities'
          );
        }

        // Top Travelled Cities Chart
        if ($scope.analytics.topTravelledCities?.labels?.length > 0) {
          $scope.renderChart(
            'topTravelledCities',
            $scope.analytics.topTravelledCities.labels,
            [{
              data: $scope.analytics.topTravelledCities.values
            }],
            'pie',
            'Most Travelled Cities (km)'
          );
        }

        // Top Travelled Categories Chart
        if ($scope.analytics.topTravelledCategories?.labels?.length > 0) {
          $scope.renderChart(
            'topTravelledCategories',
            $scope.analytics.topTravelledCategories.labels,
            [{
              label: 'Distance by Category',
              data: $scope.analytics.topTravelledCategories.values
            }],
            'bar',
            'Distance Travelled by Category (km)'
          );
        }

        // Top Booked Cars Chart
        if ($scope.analytics.topBookedCars?.labels?.length > 0) {
          $scope.renderChart(
            'topBookedCars',
            $scope.analytics.topBookedCars.labels,
            [{
              label: 'Number of Bookings',
              data: $scope.analytics.topBookedCars.values
            }],
            'bar',
            'Most Booked Cars'
          );
        }

        // Booking Trend Chart
        if ($scope.analytics.bookingTrend?.labels?.length > 0) {
          $scope.renderChart(
            'bookingTrend',
            $scope.analytics.bookingTrend.labels,
            [{
              label: 'Bookings Over Time',
              data: $scope.analytics.bookingTrend.values,
              tension: 0.4
            }],
            'line',
            'Booking Trend'
          );
        }

        // Trip Type Analysis Chart
        if ($scope.analytics.tripTypeAnalysis && $scope.analytics.tripTypeAnalysis.length > 0) {
          const tripTypeLabels = $scope.analytics.tripTypeAnalysis.map(item => item.tripType);
          const tripTypeRevenue = $scope.analytics.tripTypeAnalysis.map(item => item.metrics.totalRevenue);
          const tripTypeBookings = $scope.analytics.tripTypeAnalysis.map(item => item.metrics.totalBookings);
          
          $scope.renderChart(
            'tripTypeChart',
            tripTypeLabels,
            [
              {
                label: 'Total Revenue',
                data: tripTypeRevenue,
                type: 'bar',
                yAxisID: 'y1'
              },
              {
                label: 'Total Bookings',
                data: tripTypeBookings,
                type: 'line',
                yAxisID: 'y2'
              }
            ],
            'mixed',
            'Trip Type Analysis'
          );
        }

        // Mileage Analysis Chart
        if ($scope.analytics.mileageAnalysis && $scope.analytics.mileageAnalysis.length > 0) {
          renderMileageChart($scope.analytics.mileageAnalysis);
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
     * @param {Array} datasets - Chart datasets
     * @param {string} chartType - Type of chart (bar, pie, line, mixed)
     * @param {string} chartTitle - Title of the chart
     */
    $scope.renderChart = function(elementId, labels, datasets, chartType, chartTitle) {
      let ctx = document.getElementById(elementId);
      
      if (!ctx) {
        console.error(`Canvas element with ID ${elementId} not found`);
        return;
      }
      
      ctx = ctx.getContext("2d");

      // Configure scales based on chart type
      let scales = {};
      if (chartType === 'mixed') {
        scales = {
          y1: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            title: {
              display: true,
              text: 'Revenue (₹)'
            }
          },
        };
      } 
      
      // Configure chart data
      let chartData = {
        labels: labels,
        datasets: datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: chartType === 'pie' ? 
            pieColors : 
            dataset.type === 'line' ? 
              'rgba(75, 192, 192, 0.2)' : 
              barColors[index % barColors.length],
          borderColor: chartType === 'pie' ? 
            pieColors : 
            dataset.type === 'line' ? 
              'rgba(75, 192, 192, 1)' : 
              barColors[index % barColors.length],
          borderWidth: 1,
          fill: dataset.type === 'line'
        }))
      };

      // Configure chart options
      let chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: scales,
        plugins: {
          legend: {
            display: chartType === 'pie' || chartType === 'mixed' || datasets.length > 1,
            position: 'top',
          },
          title: {
            display: true,
            text: chartTitle,
            font: {
              size: 16
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
        type: chartType === 'mixed' ? 'bar' : chartType,
        data: chartData,
        options: chartOptions
      });
    };

    /**
     * @description Get CSS class based on value for visual indicators
     * @param {number} value - The value to check
     * @param {string} type - The type of value being checked
     * @returns {string} CSS class name
     */
    $scope.getStatusClass = function(value, type) {
      switch(type) {
        case 'successRate':
          return value >= 70 ? 'text-success' : 
                 value >= 40 ? 'text-warning' : 'text-danger';
        case 'lateReturns':
          return value === 0 ? 'text-success' : 
                 value <= 5 ? 'text-warning' : 'text-danger';
        default:
          return '';
      }
    };

    /**
     * @description Format currency values
     * @param {number} value - The value to format
     * @returns {string} Formatted currency string
     */
    $scope.formatCurrency = function(value) {
      return value ? `₹${value.toFixed(2)}` : '₹0.00';
    };

    /**
     * @description Format percentage values
     * @param {number} value - The value to format
     * @returns {string} Formatted percentage string
     */
    $scope.formatPercentage = function(value) {
      return value ? `${value.toFixed(1)}%` : '0%';
    };

 

    function renderMileageChart(data) {
      const ctx = document.getElementById('mileageChart');
      if (!ctx) return;

      // Properly check and destroy existing chart
      if (window.mileageChart && typeof window.mileageChart.destroy === 'function') {
        window.mileageChart.destroy();
      }

      const labels = data.map(item => item.carName);
      const totalDistance = data.map(item => item.metrics.totalDistance);
      const avgTripDistance = data.map(item => item.metrics.avgTripDistance);

      window.mileageChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Total Distance (km)',
              data: totalDistance,
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Average Trip Distance (km)',
              data: avgTripDistance,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Distance (km)'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Vehicle Mileage Analysis'
            }
          }
        }
      });
    }
  }
]);