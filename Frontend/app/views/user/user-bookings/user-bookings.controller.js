/**
 * @description User Booking Controller - Manages user's car rental booking operations
 * Handles booking listing, filtering, sorting, and duration calculations for user bookings
 */
myApp.controller("userBookingController", [
  "$scope",
  "BookingService",
  "ToastService",
  function ($scope, BookingService, ToastService) {
    // ==========================================
    // State Management
    // ==========================================
    
    /**
     * @type {Array}
     * @description List of all bookings made by the user
     */
    $scope.bookings = [];

    /**
     * @type {string}
     * @description Search query for filtering bookings by car name
     */
    $scope.search = "";

    /**
     * @type {string}
     * @description Current sort option for booking listing
     */
    $scope.sortOption = "bidAmount"; // Default sort by bid amount

    /**
     * @type {string}
     * @description Selected filter for booking status
     */
    $scope.selectedFilter = ""; // Default no status filter

    // Pagination states
    $scope.totalItems = 0;
    $scope.currentPage = 1;
    $scope.maxSize = 5;
    $scope.itemsPerPage = 10;

    /**
     * @type {Array}
     * @description Available sorting options for booking listing
     */
    $scope.sortOptions = [
      { value: "bidAmount", label: "Price: High to Low" },
      { value: "createdAt", label: "Created Date: New to Old" },
      { value: "-createdAt", label: "Created Date: Old to New" },
    ];

    /**
     * @type {Object}
     * @description Booking status filter options
     */
    $scope.filterBookings = {
      pending: "pending",
      paid: "paid",
    };

    // ==========================================
    // Initialization
    // ==========================================
    
    /**
     * @description Initialize the booking dashboard
     * Loads initial booking data and sets up the view
     */
    $scope.init = function() {
      $scope.isLoading = true;
      BookingService.getAllBookings({sortBy: "bidAmount"})
        .then((response) => {
          $scope.bookings = response.bookings;
          $scope.totalItems = response.metadata.total;
        })
        .catch((e) => {
          ToastService.error("Unable to fetch bookings", 3000);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    // ==========================================
    // Data Operations
    // ==========================================
    
    /**
     * @description Fetch filtered bookings based on current search, filter, and sort options
     * Updates the booking listing with paginated results
     * @param {number} currentPage - The page number to fetch
     */
    $scope.getUserBookings = function(currentPage) {
      // Build query parameters
      let param = {};
      if ($scope.search) param.carName = $scope.search;
      if ($scope.selectedFilter) param.status = $scope.selectedFilter;
      if ($scope.sortOption) param.sortBy = $scope.sortOption;
      if ($scope.itemsPerPage) param.limit = $scope.itemsPerPage;
      param.page = currentPage;

      // Fetch filtered bookings
      BookingService.getAllBookings(param)
        .then((response) => {
          $scope.bookings = response.bookings;
          $scope.totalItems = response.metadata.total;
          $scope.currentPage = response.metadata.page;
        })
        .catch((e) => {
          ToastService.error("Unable to fetch bookings", 3000);
        });
    };

    // ==========================================
    // Utility Functions
    // ==========================================
    
    /**
     * @description Calculate the duration between two dates in days
     * @param {Date|string} startDate - Start date of the rental period
     * @param {Date|string} endDate - End date of the rental period
     * @returns {number} Number of days between the dates (minimum 1 day)
     */
    $scope.calculateDuration = function(startDate, endDate) {
      if (!startDate || !endDate) return 0;

      let start = new Date(startDate);
      let end = new Date(endDate);

      let diffTime = Math.abs(end - start);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))+1;

      return diffDays;
    };

    // ==========================================
    // Invoice Generation
    // ==========================================
    
    /**
     * @description Generate and display a PDF invoice for a booking
     * @param {Object} booking - The booking to generate invoice for
     */
    $scope.getInvoice = function(booking) {
      console.log("booking", booking);
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const lineGap = 6;
      let y = 15;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Car Rental Invoice", 105, y, { align: "center" });
      y += 8;

      // Line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(180);
      doc.line(20, y, 190, y);
      y += 8;

      // Booking Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Booking Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");

      // Add booking information
      doc.text(`Invoice ID: ${booking._id}`, 20, y); y += lineGap;
      doc.text(`Payment Status: ${booking.paymentStatus}`, 20, y); y += lineGap;
      doc.text(`Total Amount: Rs. ${booking.totalAmount}`, 20, y); y += lineGap;
      doc.text(`Distance Travelled: ${booking.distanceTravelled || 0} km`, 20, y); y += lineGap;
      doc.text(`Bid Amount: Rs. ${booking.bidAmount}`, 20, y); y += lineGap;
      doc.text(`Start Date: ${new Date(booking.startDate).toLocaleDateString()}`, 20, y); y += lineGap;
      doc.text(`End Date: ${new Date(booking.endDate).toLocaleDateString()}`, 20, y); y += lineGap;
      doc.text(`Duration: ${$scope.calculateDuration(booking.startDate, booking.endDate)} days`, 20, y); y += lineGap;
      doc.text(`Trip Type: ${booking.tripType === 'outStation' ? 'Outstation' : 'In-City'}`, 20, y); y += lineGap;

      // Section separator
      y += 3;
      doc.setDrawColor(220);
      doc.line(20, y, 190, y);
      y += 8;

      // Car Details
      doc.setFont("helvetica", "bold");
      doc.text("Car Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");

      // Add car information
      doc.text(`Name: ${booking.car.carName}`, 20, y); y += lineGap;
      doc.text(`Category: ${booking.car.category}`, 20, y); y += lineGap;
      doc.text(`Fuel Type: ${booking.car.fuelType}`, 20, y); y += lineGap;
      doc.text(`Base Price: Rs. ${booking.car.basePrice}`, 20, y); y += lineGap;
      doc.text(`Price per KM: Rs. ${booking.car.pricePerKm}`, 20, y); y += lineGap;
      if (booking.tripType === 'outStation') {
        doc.text(`Outstation Charges: Rs. ${booking.car.outStationCharges}/day`, 20, y); y += lineGap;
      }

      // Section separator
      y += 3;
      doc.setDrawColor(220);
      doc.line(20, y, 190, y);
      y += 8;

      // Owner Details
      doc.setFont("helvetica", "bold");
      doc.text("Owner Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");

      // Add owner information
      doc.text(`Name: ${booking.owner.name}`, 20, y); y += lineGap;
      doc.text(`Email: ${booking.owner.email}`, 20, y); y += lineGap;
      doc.text(`Phone: ${booking.owner.phone || 'N/A'}`, 20, y); y += lineGap;

      // Save the PDF
      doc.save(`invoice-${booking._id}.pdf`);
    };

    // Initialize controller
    $scope.init();
  },
]);
