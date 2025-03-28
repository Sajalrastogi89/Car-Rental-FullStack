myApp.controller("ownerBookingController", [
  "$scope",
  "$q",
  "IndexedDBService",
  "ToastService",
  "$uibModal", // Add UI Bootstrap Modal service
  "BookingService",
  function (
    $scope,
    $q,
    IndexedDBService,
    ToastService,
    $uibModal,
    BookingService
  ) {
    $scope.bookings = []; // declare and initialize bookings
    $scope.selectedFilter = false; // selected filter is for 'in progress' bookings
    $scope.selectedSort = "car.name";
    // hardcoded dropdown values
    $scope.filterBooking = {
      "In Progess": false,
      "History": true,
    };
$scope.today=new Date();
    // this will run when page is loaded
    $scope.init = function () {
      $scope.isLoading = true;
      BookingService.getAllBookings()
        .then((allBookings) => {
          console.log(allBookings);
          $scope.bookings = allBookings;
          $scope.isLoading = false;
        })
        .catch(() => {
          ToastService.error("Unable to fetch bookings");
          $scope.isLoading = false;
        });
    };

   


  

    /**
     * @description - Calculate duration between two dates in days
     * @param {Date|string} startDate
     * @param {Date|string} endDate
     * @returns {number} Number of days
     */
    $scope.calculateDuration = function (startDate, endDate) {
      if (!startDate || !endDate) return 0;

      let start = new Date(startDate);
      let end = new Date(endDate);

      let diffTime = Math.abs(end - start);
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays || 1; // At least 1 day
    };

    /**
     * @description - Open invoice modal using the invoiceModal component
     * @param {Object} booking
     */
    $scope.openInvoice = function (booking) {
      let duration=$scope.calculateDuration(booking.car.startDate,booking.car.endDate);
      let baseAmount = booking.car.basePrice * duration;
      let distanceAmount =
        (booking.distanceTravelled || 0) * booking.car.pricePerKm;
      let subtotal = booking.totalAmount;
      let totalAmount = subtotal;

      // Open modal with UI Bootstrap
      let modalInstance = $uibModal.open({
        component: "invoiceModal",
        backdrop: "static", // Prevents closing on click outside
        size: "lg", // Large modal
        resolve: {
          // Pass all data to the modal component
          booking: function () {
            return booking;
          },
          invoiceDate: function () {
            return new Date();
          },
          duration: function () {
            return duration;
          },
          baseAmount: function () {
            return baseAmount;
          },
          distanceAmount: function () {
            return distanceAmount;
          },
          subtotal: function () {
            return subtotal;
          },
          totalAmount: function () {
            return totalAmount;
          },
        },
      });

      // Handle modal actions
      modalInstance.result.then(function () {
        // This runs when modal is dismissed
        console.log("Invoice modal dismissed");
      });
    };

    /**
     * @deprecated - No longer needed with UI Bootstrap modal
     * Use openInvoice instead which uses the invoiceModal component
     */
    $scope.closeInvoice = function (booking) {
      // This function is no longer needed as the modal has its own close functionality
      // Kept for backward compatibility
      booking.showInvoice = false;
    };



    $scope.saveOdometerValue = function (booking,type) {
      console.log("booking", booking);
      let odometerValue;
      if(type==='start'){
        
        odometerValue = booking.startOdometer;
      }
      else if(type==='end'){

        odometerValue = booking.endOdometer;
      }
      console.log("type", type);
      BookingService.updateStartOdometer(booking._id, odometerValue, type, booking.car._id)
        .then((updatedBooking) => {
          booking.car.travelled = updatedBooking.data.booking.car.travelled;
          booking.startOdometer=updatedBooking.data.booking.startOdometer;
          booking.endOdometer=updatedBooking.data.booking.endOdometer;
          booking.paymentStatus=updatedBooking.data.booking.paymentStatus;
          console.log("booking response", updatedBooking.data);
          console.log("updatedBooking", updatedBooking);
          console.log("booking", booking);
          ToastService.success("Start odometer updated successfully");
        })
        .catch((e) => {
          console.log(e);
          ToastService.error("Error in updating start odometer");
        });
    }
    $scope.isOnOrBeforeToday = function(dateString) {
      if (!dateString) return false;
      
      let inputDate = new Date(dateString);
      let today = new Date();
      
      // Set both dates to midnight to compare only dates, not times
      inputDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      
      return inputDate <= today;
    };

    $scope.getInvoice = function (booking) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
    
      const lineGap = 8;
      let y = 20;
    
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Car Rental Invoice", 105, y, { align: "center" });
      y += 10;
    
      // Line separator
      doc.setLineWidth(0.5);
      doc.setDrawColor(180);
      doc.line(20, y, 190, y);
      y += 10;
    
      // Booking Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Booking Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");
    
      doc.text(`Invoice ID: ${booking._id}`, 20, y); y += lineGap;
      doc.text(`Payment Status: ${booking.paymentStatus}`, 20, y); y += lineGap;
      doc.text(`Total Amount: Rs. ${booking.totalAmount}`, 20, y); y += lineGap;
      doc.text(`Distance Travelled: ${booking.distanceTravelled} km`, 20, y); y += lineGap;
      doc.text(`Bid Amount: Rs. ${booking.bidAmount}`, 20, y); y += lineGap;
      doc.text(`Start Date: ${new Date(booking.startDate).toLocaleDateString()}`, 20, y); y += lineGap;
      doc.text(`End Date: ${new Date(booking.endDate).toLocaleDateString()}`, 20, y); y += lineGap;
      doc.text(`Late Days: ${booking.lateDays}`, 20, y); y += lineGap;
      doc.text(`Late Fee: Rs. ${booking.lateFee}`, 20, y); y += lineGap;
    
      y += 5;
      doc.setDrawColor(220);
      doc.line(20, y, 190, y);
      y += 10;
    
      // Car Details
      doc.setFont("helvetica", "bold");
      doc.text("Car Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");
    
      doc.text(`Name: ${booking.car.carName}`, 20, y); y += lineGap;
      doc.text(`Category: ${booking.car.category}`, 20, y); y += lineGap;
      doc.text(`Fuel Type: ${booking.car.fuelType}`, 20, y); y += lineGap;
      doc.text(`Base Price: Rs. ${booking.car.basePrice}`, 20, y); y += lineGap;
      doc.text(`Price per KM: Rs. ${booking.car.pricePerKm}`, 20, y); y += lineGap;
    
      y += 5;
      doc.setDrawColor(220);
      doc.line(20, y, 190, y);
      y += 10;
    
      // User Info
      doc.setFont("helvetica", "bold");
      doc.text("User Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");
    
      doc.text(`Name: ${booking.user.name}`, 20, y); y += lineGap;
      doc.text(`Email: ${booking.user.email}`, 20, y); y += lineGap;
    
      y += 5;
      doc.setDrawColor(220);
      doc.line(20, y, 190, y);
      y += 10;
    
      // Owner Info
      doc.setFont("helvetica", "bold");
      doc.text("Owner Details", 20, y); y += lineGap;
      doc.setFont("helvetica", "normal");
    
      doc.text(`Name: ${booking.owner.name}`, 20, y); y += lineGap;
      doc.text(`Email: ${booking.owner.email}`, 20, y); y += lineGap;
    
      // Highlight Total
      y += 15;
      doc.setDrawColor(0);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, y, 170, 15, 'FD');
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`Total Payable Amount: ₹${booking.totalAmount}`, 25, y + 10);
    
      // Save the PDF
      doc.save(`Invoice_${booking._id}.pdf`);
    };
    

    

  },
]);
