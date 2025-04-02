/**
 * BidFactory - Manages bid validation and creation
 * Provides methods for validating bid properties, creating bid objects,
 * and utility functions for bid-related operations
 */
myApp.factory('BidFactory', ['$q', function($q) {
  // ==========================================
  // Validation Rules
  // ==========================================
  
  /**
   * Constants used for validation
   */
  const VALIDATION_RULES = {
    TRIP_TYPES: ['inCity', 'outStation'] // Valid trip types
  };
  
  // ==========================================
  // Bid Constructor
  // ==========================================
  
  /**
   * Bid constructor - Creates a new bid with validation
   * @param {Object} data - Bid data to initialize with
   * @param {string} data.carId - ID of car being bid on
   * @param {number} data.bidAmount - Amount of the bid
   * @param {string|Date} data.startDate - Start date of rental period
   * @param {string|Date} data.endDate - End date of rental period
   * @param {string} [data.status='pending'] - Bid status
   * @param {string} [data.tripType] - Type of trip (inCity/outStation)
   */
  function Bid(data) {
    // Use empty object if no data provided
    data = data || {};
    
    // Initialize and validate each property
    this._id = data._id || null;
    this.carId = this.validateCarId(data.carId);
    this.bidAmount = this.validateBidAmount(data.bidAmount, data.basePrice);
    this.startDate = this.validateStartDate(data.startDate);
    this.endDate = this.validateEndDate(data.endDate, data.startDate);
    this.status = data.status || 'pending';
    this.tripType = this.validateTripType(data.tripType);
    
    // Calculate rental duration in days
    if (this.startDate && this.endDate) {
      this.days = this.calculateDays(this.startDate, this.endDate);
    }
  }
  
  // ==========================================
  // Validation Methods
  // ==========================================
  
  Bid.prototype = {
    /**
     * Validates car ID
     * @param {string} carId - Car ID to validate
     * @returns {string} Validated car ID
     * @throws {Error} If validation fails
     */
    validateCarId: function(carId) {
      if (!carId) {
        throw new Error('Car ID is required');
      }
      return carId;
    },
    
    /**
     * Validates bid amount
     * @param {number|string} amount - Bid amount to validate
     * @param {number|string} basePrice - Car's base price for comparison
     * @returns {number} Validated bid amount
     * @throws {Error} If validation fails
     */
    validateBidAmount: function(amount, basePrice) {
      if (!amount) {
        throw new Error('Bid amount is required');
      }
      
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount)) {
        throw new Error('Bid amount must be a number');
      }
      
      // Ensure bid is higher than the base price
      if (basePrice && numAmount <= parseFloat(basePrice)) {
        throw new Error(`Bid amount must be greater than the base price of ${basePrice}`);
      }
      
      return numAmount;
    },
    
    /**
     * Validates start date for a booking
     * @param {string|Date} date - Start date to validate
     * @returns {string} Validated start date
     * @throws {Error} If validation fails
     */
    validateStartDate: function(date) {
      if (!date) {
        throw new Error('Start date is required');
      }
      
      const dateObj = new Date(date);
      if (dateObj.toString() === 'Invalid Date') {
        throw new Error('Start date is invalid');
      }
      
      // Set time to beginning of day for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(dateObj);
      startDate.setHours(0, 0, 0, 0);
      
      // Prevent past dates
      if (startDate < today) {
        throw new Error('Start date cannot be in the past');
      }
      
      return date;
    },
    
    /**
     * Validates end date for a booking
     * @param {string|Date} endDate - End date to validate
     * @param {string|Date} startDate - Start date for comparison
     * @returns {string} Validated end date
     * @throws {Error} If validation fails
     */
    validateEndDate: function(endDate, startDate) {
      if (!endDate) {
        throw new Error('End date is required');
      }
      
      const endDateObj = new Date(endDate);
      if (endDateObj.toString() === 'Invalid Date') {
        throw new Error('End date is invalid');
      }
      
      // Check that end date is after start date
      if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setHours(0, 0, 0, 0);
        
        if (endDateObj < startDateObj) {
          throw new Error('End date must be after start date');
        }
      }
      
      return endDate;
    },
    
    /**
     * Validates trip type
     * @param {string} tripType - Trip type to validate
     * @returns {string} Validated trip type or default value
     * @throws {Error} If validation fails
     */
    validateTripType: function(tripType) {
      if (!tripType) {
        return 'local'; // Default trip type
      }
      
      if (!VALIDATION_RULES.TRIP_TYPES.includes(tripType)) {
        throw new Error(`Invalid trip type. Must be one of: ${VALIDATION_RULES.TRIP_TYPES.join(', ')}`);
      }
      
      return tripType;
    },
    
    /**
     * Calculates number of days between two dates
     * @param {string|Date} startDate - Start date
     * @param {string|Date} endDate - End date
     * @returns {number} Number of days
     */
    calculateDays: function(startDate, endDate) {
      if (!startDate || !endDate) {
        return 0;
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Validates all bid properties together
     * Collects errors instead of throwing
     * @returns {Object} Validation result with errors list
     * @returns {boolean} result.isValid - Whether all validations passed
     * @returns {Array} result.errors - List of error messages
     * @returns {string} result.message - Combined error message or success message
     */
    validate: function() {
      const errors = [];
      
      // Try validating each field, collecting errors
      try { this.validateCarId(this.carId); } 
      catch (e) { errors.push(e.message); }
      
      try { this.validateBidAmount(this.bidAmount, this.basePrice); } 
      catch (e) { errors.push(e.message); }
      
      try { this.validateStartDate(this.startDate); } 
      catch (e) { errors.push(e.message); }
      
      try { this.validateEndDate(this.endDate, this.startDate); } 
      catch (e) { errors.push(e.message); }
      
      try { this.validateTripType(this.tripType); } 
      catch (e) { errors.push(e.message); }
      
      return {
        isValid: errors.length === 0,
        errors: errors,
        message: errors.length > 0 ? errors.join('. ') : 'Bid data is valid'
      };
    }
  };
  
  // ==========================================
  // Factory Public API
  // ==========================================
  
  return {
    /**
     * Creates a new bid instance with validation
     * @param {Object} data - Bid data to create from
     * @returns {Promise<Bid>} Promise resolving to bid instance
     */
    createBid: function(data) {
      const deferred = $q.defer();
      try {
        const bid = new Bid(data);
        deferred.resolve(bid);
      } catch (error) {
        deferred.reject(error);
      }
      return deferred.promise;
    },
    
    /**
     * Validates bid data without creating a bid instance
     * @param {Object} data - Bid data to validate
     * @returns {Object} Validation result object
     * @returns {boolean} result.isValid - Whether validation passed
     * @returns {Array} result.errors - List of validation errors
     * @returns {string} result.message - Combined error message
     */
    validateBidData: function(data) {
      try {
        const bid = new Bid(data);
        return bid.validate();
      } catch (error) {
        return {
          isValid: false,
          errors: [error.message],
          message: error.message
        };
      }
    },
    
    /**
     * Calculate days between two dates (utility function)
     * @param {string|Date} startDate - Start date
     * @param {string|Date} endDate - End date
     * @returns {number} Number of days between the dates
     */
    calculateDays: function(startDate, endDate) {
      if (!startDate || !endDate) {
        return 0;
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Format price with Indian Rupee symbol
     * @param {number|string} amount - Amount to format
     * @returns {string} Formatted price with currency symbol
     */
    formatPrice: function(amount) {
      return `₹${parseFloat(amount || 0).toFixed(2)}`;
    }
  };
}]);