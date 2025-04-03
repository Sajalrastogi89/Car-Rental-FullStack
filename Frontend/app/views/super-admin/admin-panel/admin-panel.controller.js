myApp.controller("SuperAdminAnalysisController", [
  "$scope",
  "$http",
  "$q",
  "$timeout",
  "$state",
  "AuthService",
  function ($scope, $http, $q, $timeout, $state, AuthService) {
    $scope.analytics = null;
    $scope.error = null;
    $scope.isLoading = false;
    
    // Date picker configuration
    $scope.dateRange = {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)), // Default to last 3 months
      endDate: new Date()
    };
    
    // Logout function
    $scope.logout = function() {
      AuthService.logout();
      $state.go('auth');
    };
    
    $scope.startDateOpened = false;
    $scope.endDateOpened = false;
    
    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1,
      showWeeks: false
    };
    
    $scope.altInputFormats = ['M!/d!/yyyy'];
    
    $scope.openStartDate = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.startDateOpened = true;
      $scope.endDateOpened = false;
    };
    
    $scope.openEndDate = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.endDateOpened = true;
      $scope.startDateOpened = false;
    };
    
    // Preset date range filters
    $scope.setLastMonth = function() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 1);
      
      $scope.dateRange.startDate = startDate;
      $scope.dateRange.endDate = endDate;
      $scope.updateDateRange();
    };
    
    $scope.setLastThreeMonths = function() {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - 3);
      
      $scope.dateRange.startDate = startDate;
      $scope.dateRange.endDate = endDate;
      $scope.updateDateRange();
    };
    
    $scope.setThisYear = function() {
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), 0, 1); // January 1st of current year
      
      $scope.dateRange.startDate = startDate;
      $scope.dateRange.endDate = endDate;
      $scope.updateDateRange();
    };
    
    $scope.dismissError = function() {
      $scope.error = null;
    };

    $scope.init = function () {
      $scope.isLoading = true;
      $scope.loadAnalytics();
    };

    $scope.updateDateRange = function() {
      $scope.isLoading = true;
      $scope.loadAnalytics();
    };

    $scope.loadAnalytics = function() {
      // Format dates for API call
      const formattedStartDate = formatDateForAPI($scope.dateRange.startDate);
      const formattedEndDate = formatDateForAPI($scope.dateRange.endDate);
      
      $http.get(`http://localhost:8000/api/analysis/admin?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
        .then(response => {
          if (response.data.success) {
            $scope.analytics = response.data.data;
            console.log("analytics", $scope.analytics);
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

    // Helper function to format dates for API
    function formatDateForAPI(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    // Chart.js configuration and rendering
    $scope.renderCharts = function() {
      // Make sure analytics data exists
      if (!$scope.analytics) return;

      $timeout(function() {
        renderRevenueTrend();
        renderTopOwners();
        renderTopRenters();
        renderBookingsByStatus();
        renderCategoryDistribution();
        renderCityDistribution();
        renderUserGrowth();
      }, 100);
    };
    
    // Helper function to destroy existing chart instances
    function destroyChart(chartId) {
      if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
      }
    }
    
    // Individual chart rendering functions
    function renderRevenueTrend() {
      if (!$scope.analytics.bookingTrend || !$scope.analytics.bookingTrend.labels) return;
      
      destroyChart('revenueTrend');
      
      const ctx = document.getElementById('revenueTrend').getContext('2d');
      
      // Create chart instance and store reference
      if (!window.chartInstances) window.chartInstances = {};
      window.chartInstances['revenueTrend'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: $scope.analytics.bookingTrend.labels,
          datasets: [
            {
              label: 'Revenue (₹)',
              data: $scope.analytics.bookingTrend.revenueValues,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: 'Bookings',
              data: $scope.analytics.bookingTrend.bookingValues,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          stacked: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Revenue (₹)'
              },
              ticks: {
                callback: function(value) {
                  return '₹' + value.toLocaleString();
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Bookings'
              },
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                precision: 0,
                callback: function(value) {
                  return Math.round(value);
                }
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Revenue & Booking Trend',
              font: { size: 16 }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  
                  if (context.dataset.label.includes('Revenue')) {
                    return label + '₹' + context.raw.toLocaleString();
                  }
                  return label + Math.round(context.raw);
                }
              }
            }
          }
        }
      });
    }
    
    function renderTopOwners() {
      if (!$scope.analytics.topOwners || !$scope.analytics.topOwners.labels) return;
      
      destroyChart('topOwners');
      
      const ctx = document.getElementById('topOwners').getContext('2d');
      
      window.chartInstances['topOwners'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: $scope.analytics.topOwners.labels,
          datasets: [{
            label: 'Revenue (₹)',
            data: $scope.analytics.topOwners.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(201, 203, 207, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 99, 132, 0.7)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)',
              'rgb(201, 203, 207)',
              'rgb(255, 159, 64)',
              'rgb(54, 162, 235)',
              'rgb(255, 99, 132)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Car Owners by Revenue',
              font: { size: 16 }
            },
            
          },
         
        }
      });
    }

    function renderTopRenters() {
      if (!$scope.analytics.topRenters || !$scope.analytics.topRenters.labels) return;
      
      destroyChart('topRenters');
      
      const ctx = document.getElementById('topRenters').getContext('2d');
      
      window.chartInstances['topRenters'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: $scope.analytics.topRenters.labels,
          datasets: [{
            label: 'Amount Spent (₹)',
            data: $scope.analytics.topRenters.values,
            backgroundColor: [
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(201, 203, 207, 0.7)',
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)'
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)',
              'rgb(201, 203, 207)',
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)',
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Renters by Spending',
              font: { size: 16 }
            }
          }
        }
      });
    }

    function renderBookingsByStatus() {
      if (!$scope.analytics.bookingsByStatus || !$scope.analytics.bookingsByStatus.labels) return;
      
      destroyChart('bookingsByStatus');
      
      const ctx = document.getElementById('bookingsByStatus').getContext('2d');
      
      // Status colors
      const statusColors = {
        'pending': 'rgba(255, 206, 86, 0.7)',
        'confirmed': 'rgba(54, 162, 235, 0.7)',
        'ongoing': 'rgba(75, 192, 192, 0.7)',
        'completed': 'rgba(153, 102, 255, 0.7)',
        'cancelled': 'rgba(255, 99, 132, 0.7)',
        'rejected': 'rgba(201, 203, 207, 0.7)'
      };
      
      // Status border colors
      const statusBorderColors = {
        'pending': 'rgb(255, 206, 86)',
        'confirmed': 'rgb(54, 162, 235)',
        'ongoing': 'rgb(75, 192, 192)',
        'completed': 'rgb(153, 102, 255)',
        'cancelled': 'rgb(255, 99, 132)',
        'rejected': 'rgb(201, 203, 207)'
      };
      
      // Generate colors based on status
      const backgroundColors = $scope.analytics.bookingsByStatus.labels.map(
        status => statusColors[status.toLowerCase()] || 'rgba(201, 203, 207, 0.7)'
      );
      
      const borderColors = $scope.analytics.bookingsByStatus.labels.map(
        status => statusBorderColors[status.toLowerCase()] || 'rgb(201, 203, 207)'
      );
      
      window.chartInstances['bookingsByStatus'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: $scope.analytics.bookingsByStatus.labels,
          datasets: [{
            data: $scope.analytics.bookingsByStatus.values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Bookings by Status',
              font: { size: 16 }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.formattedValue;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((context.raw / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    function renderCategoryDistribution() {
      if (!$scope.analytics.categoryDistribution || !$scope.analytics.categoryDistribution.labels) return;
      
      destroyChart('categoryDistribution');
      
      const ctx = document.getElementById('categoryDistribution').getContext('2d');
      
      // Category colors
      const colorPalette = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(201, 203, 207, 0.7)'
      ];
      
      const borderColorPalette = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)',
        'rgb(153, 102, 255)',
        'rgb(255, 159, 64)',
        'rgb(201, 203, 207)'
      ];
      
      // Generate colors for each category
      const backgroundColors = [];
      const borderColors = [];
      
      $scope.analytics.categoryDistribution.labels.forEach((_, index) => {
        const colorIndex = index % colorPalette.length;
        backgroundColors.push(colorPalette[colorIndex]);
        borderColors.push(borderColorPalette[colorIndex]);
      });
      
      window.chartInstances['categoryDistribution'] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: $scope.analytics.categoryDistribution.labels,
          datasets: [{
            data: $scope.analytics.categoryDistribution.values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Car Categories Distribution',
              font: { size: 16 }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.formattedValue;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((context.raw / total) * 100);
                  return `${label}: ${value} cars (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    function renderCityDistribution() {
      if (!$scope.analytics.cityDistribution || !$scope.analytics.cityDistribution.labels) return;
      
      destroyChart('cityDistribution');
      
      const ctx = document.getElementById('cityDistribution').getContext('2d');
      
      window.chartInstances['cityDistribution'] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: $scope.analytics.cityDistribution.labels,
          datasets: [{
            label: 'Cars Available',
            data: $scope.analytics.cityDistribution.values,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Cars by City',
              font: { size: 16 }
            },
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.raw} cars available`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Cars'
              },
              ticks: {
                precision: 0,
                callback: function(value) {
                  return Math.round(value);
                }
              }
            }
          }
        }
      });
    }

    function renderUserGrowth() {
      if (!$scope.analytics.userGrowth || !$scope.analytics.userGrowth.labels) return;
      
      destroyChart('userGrowth');
      
      const ctx = document.getElementById('userGrowth').getContext('2d');
      
      window.chartInstances['userGrowth'] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: $scope.analytics.userGrowth.labels,
          datasets: [
            {
              label: 'Total New Users',
              data: $scope.analytics.userGrowth.totalUsers,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            },
            {
              label: 'New Car Owners',
              data: $scope.analytics.userGrowth.ownerCounts,
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            },
            {
              label: 'New Renters',
              data: $scope.analytics.userGrowth.renterCounts,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'User Growth Over Time',
              font: { size: 16 }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  return label + Math.round(context.raw);
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of New Users'
              },
              ticks: {
                precision: 0,
                callback: function(value) {
                  return Math.round(value);
                }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Date'
              }
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          }
        }
      });
    }
    
 
  }
]);