/**
 * CarFactory - A service for managing car-related operations
 * Uses prototype pattern for efficient method sharing
 */
myApp.factory('CarFactory', ['$http', '$q', 'AuthService', 'FileUploadService', function($http, $q, AuthService, FileUploadService) {
  
  /**
   * Car constructor function
   * @param {Object} carData - Car data object
   */
  function Car(carData) {
    // Initialize with empty object if no data provided
    carData = carData || {};
    
    // Basic car properties
    this._id = carData._id || null;
    this.carName = carData.carName || '';
    this.category = carData.category || '';
    this.fuelType = carData.fuelType || '';
    
    // Pricing and rental details
    this.basePrice = carData.basePrice || 0;
    this.pricePerKm = carData.pricePerKm || 0;
    this.outStationCharges = carData.outStationCharges || 0;
    this.travelled = carData.travelled || 0;
    this.finePercentage = carData.finePercentage || 50; // Default 50%
    
    // Features and specifications
    this.features = carData.features || [];
    
    // Status and availability
    this.isDisabled = carData.isDisabled || false;
    this.city = carData.city || '';
    
    // Car images
    this.imageUrl = carData.imageUrl || [];
  }



  Car
  
  /**
   * Validate car basic information
   * @returns {Object} Validation result
   */
  Car.prototype.validateBasicInfo = function() {
    const validations = [];
    
    if (!this.make) {
      validations.push({ field: 'make', message: 'Make is required' });
    }
    
    if (!this.model) {
      validations.push({ field: 'model', message: 'Model is required' });
    }
    
    if (!this.year) {
      validations.push({ field: 'year', message: 'Year is required' });
    } else if (this.year < 1900 || this.year > new Date().getFullYear() + 1) {
      validations.push({ field: 'year', message: 'Year must be between 1900 and ' + (new Date().getFullYear() + 1) });
    }
    
    if (!this.category) {
      validations.push({ field: 'category', message: 'Category is required' });
    }
    
    if (!this.licensePlate) {
      validations.push({ field: 'licensePlate', message: 'License plate is required' });
    }
    
    return {
      isValid: validations.length === 0,
      validations: validations
    };
  };
  
  /**
   * Validate car pricing information
   * @returns {Object} Validation result
   */
  Car.prototype.validatePricing = function() {
    const validations = [];
    
    if (this.price === undefined || this.price === null || this.price === '') {
      validations.push({ field: 'price', message: 'Price is required' });
    } else if (isNaN(this.price) || this.price <= 0) {
      validations.push({ field: 'price', message: 'Price must be a positive number' });
    }
    
    if (this.pricePerKm === undefined || this.pricePerKm === null || this.pricePerKm === '') {
      validations.push({ field: 'pricePerKm', message: 'Price per km is required' });
    } else if (isNaN(this.pricePerKm) || this.pricePerKm < 0) {
      validations.push({ field: 'pricePerKm', message: 'Price per km must be a non-negative number' });
    }
    
    if (this.securityDeposit === undefined || this.securityDeposit === null || this.securityDeposit === '') {
      validations.push({ field: 'securityDeposit', message: 'Security deposit is required' });
    } else if (isNaN(this.securityDeposit) || this.securityDeposit < 0) {
      validations.push({ field: 'securityDeposit', message: 'Security deposit must be a non-negative number' });
    }
    
    return {
      isValid: validations.length === 0,
      validations: validations
    };
  };
  
  /**
   * Validate car location information
   * @returns {Object} Validation result
   */
  Car.prototype.validateLocation = function() {
    const validations = [];
    
    if (!this.location.address) {
      validations.push({ field: 'location.address', message: 'Address is required' });
    }
    
    if (!this.location.city) {
      validations.push({ field: 'location.city', message: 'City is required' });
    }
    
    if (!this.location.state) {
      validations.push({ field: 'location.state', message: 'State is required' });
    }
    
    if (!this.location.zipCode) {
      validations.push({ field: 'location.zipCode', message: 'ZIP code is required' });
    }
    
    return {
      isValid: validations.length === 0,
      validations: validations
    };
  };
  
  /**
   * Validate the entire car object
   * @returns {Object} Validation result
   */
  Car.prototype.validate = function() {
    const basicInfoValidation = this.validateBasicInfo();
    const pricingValidation = this.validatePricing();
    const locationValidation = this.validateLocation();
    
    const validations = [
      ...basicInfoValidation.validations,
      ...pricingValidation.validations,
      ...locationValidation.validations
    ];
    
    // Additional checks for required images
    if (!this.images || this.images.length === 0) {
      validations.push({ field: 'images', message: 'At least one car image is required' });
    }
    
    return {
      isValid: validations.length === 0,
      validations: validations
    };
  };
  
  /**
   * Get the car's full name (make + model + year)
   * @returns {string} Car's full name
   */
  Car.prototype.getFullName = function() {
    return `${this.year} ${this.make} ${this.model}`;
  };
  
  /**
   * Check if car documents are about to expire
   * @param {number} daysThreshold - Number of days to check for expiry
   * @returns {Object} Expiry status for registration and insurance
   */
  Car.prototype.checkDocumentsExpiry = function(daysThreshold = 30) {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + daysThreshold);
    
    return {
      registrationExpiring: this.registrationExpiry && this.registrationExpiry <= thirtyDaysFromNow,
      insuranceExpiring: this.insuranceExpiry && this.insuranceExpiry <= thirtyDaysFromNow,
      registrationExpired: this.registrationExpiry && this.registrationExpiry < today,
      insuranceExpired: this.insuranceExpiry && this.insuranceExpiry < today
    };
  };
  
  /**
   * Calculate the car age in years
   * @returns {number} Car age in years
   */
  Car.prototype.getAge = function() {
    return new Date().getFullYear() - this.year;
  };
  
  /**
   * Format price display with currency symbol
   * @param {string} currencySymbol - Currency symbol to use
   * @returns {string} Formatted price
   */
  Car.prototype.getFormattedPrice = function(currencySymbol = '₹') {
    return `${currencySymbol}${this.price.toLocaleString('en-IN')}`;
  };
  
  // Factory methods
  
  /**
   * Create a new car instance
   * @param {Object} carData - Car data
   * @returns {Car} Car instance
   */
  const createCar = function(carData) {
    return new Car(carData);
  };
  

  

  
  /**
   * Add a new car
   * @param {Car} car - Car instance
   * @param {Array<File>} imageFiles - Array of image files to upload
   * @returns {Promise<Car>} Promise resolving to created car instance
   */
  
  const addCar = function(carData) {
    const car=createCar(carData);

    const deferred = $q.defer();
    
    // Validate car data before submission
    const validation = car.validate();
    if (!validation.isValid) {
      deferred.reject({
        success: false,
        message: 'Invalid car data',
        validations: validation.validations
      });
      return deferred.promise;
    }
    
    // Upload images first if they exist
    let uploadPromise;
    if (imageFiles && imageFiles.length > 0) {
      uploadPromise = FileUploadService.uploadFiles(imageFiles, 'cars');
    } else {
      uploadPromise = $q.resolve([]);
    }
    
    uploadPromise.then(function(uploadedFiles) {
      // Add uploaded images to car object
      if (uploadedFiles.length > 0) {
        car.images = uploadedFiles.map(file => file.url);
        car.primaryImage = car.images[0];
      }
      
      // Submit car data to the API
      return $http.post('/api/cars', car);
    })
    .then(function(response) {
      deferred.resolve(new Car(response.data.car));
    })
    .catch(function(error) {
      deferred.reject(error.data ? error.data : 'Failed to add car');
    });
    
    return deferred.promise;
  };
  
  /**
   * Update an existing car
   * @param {Car} car - Car instance with updated data
   * @param {Array<File>} newImageFiles - New image files to upload
   * @returns {Promise<Car>} Promise resolving to updated car instance
   */
  const updateCar = function(car, newImageFiles) {
    const deferred = $q.defer();
    
    if (!car.id) {
      deferred.reject('Car ID is required for update');
      return deferred.promise;
    }
    
    // Validate car data before submission
    const validation = car.validate();
    if (!validation.isValid) {
      deferred.reject({
        success: false,
        message: 'Invalid car data',
        validations: validation.validations
      });
      return deferred.promise;
    }
    
    // Upload new images if they exist
    let uploadPromise;
    if (newImageFiles && newImageFiles.length > 0) {
      uploadPromise = FileUploadService.uploadFiles(newImageFiles, 'cars');
    } else {
      uploadPromise = $q.resolve([]);
    }
    
    uploadPromise.then(function(uploadedFiles) {
      // Add newly uploaded images to existing images
      if (uploadedFiles.length > 0) {
        const newImageUrls = uploadedFiles.map(file => file.url);
        car.images = [...car.images, ...newImageUrls];
        
        // If there was no primary image, set the first new one
        if (!car.primaryImage && newImageUrls.length > 0) {
          car.primaryImage = newImageUrls[0];
        }
      }
      
      // Submit updated car data to the API
      return $http.put('/api/cars/' + car.id, car);
    })
    .then(function(response) {
      deferred.resolve(new Car(response.data.car));
    })
    .catch(function(error) {
      deferred.reject(error.data ? error.data : 'Failed to update car');
    });
    
    return deferred.promise;
  };
  
  /**
   * Delete a car by ID
   * @param {string} carId - Car ID to delete
   * @returns {Promise<Object>} Promise resolving to deletion result
   */
  const deleteCar = function(carId) {
    return $http.delete('/api/cars/' + carId)
      .then(function(response) {
        return response.data;
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to delete car');
      });
  };
  
  /**
   * Update car availability status
   * @param {string} carId - Car ID
   * @param {boolean} isAvailable - Availability status
   * @returns {Promise<Car>} Promise resolving to updated car instance
   */
  const updateAvailability = function(carId, isAvailable) {
    return $http.patch('/api/cars/' + carId + '/availability', { isAvailable: isAvailable })
      .then(function(response) {
        return new Car(response.data.car);
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to update car availability');
      });
  };
  
  /**
   * Get cars belonging to a specific owner
   * @param {string} ownerId - Owner ID
   * @returns {Promise<Array<Car>>} Promise resolving to array of car instances
   */
  const getOwnerCars = function(ownerId) {
    return $http.get('/api/cars/owner/' + ownerId)
      .then(function(response) {
        const cars = response.data.cars.map(function(carData) {
          return new Car(carData);
        });
        return cars;
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to fetch owner cars');
      });
  };
  
  /**
   * Update car primary image
   * @param {string} carId - Car ID
   * @param {string} imageUrl - URL of image to set as primary
   * @returns {Promise<Car>} Promise resolving to updated car instance
   */
  const updatePrimaryImage = function(carId, imageUrl) {
    return $http.patch('/api/cars/' + carId + '/primary-image', { primaryImage: imageUrl })
      .then(function(response) {
        return new Car(response.data.car);
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to update primary image');
      });
  };
  
  /**
   * Delete car image
   * @param {string} carId - Car ID
   * @param {string} imageUrl - URL of image to delete
   * @returns {Promise<Car>} Promise resolving to updated car instance
   */
  const deleteImage = function(carId, imageUrl) {
    return $http.delete('/api/cars/' + carId + '/images', { data: { imageUrl: imageUrl } })
      .then(function(response) {
        return new Car(response.data.car);
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to delete image');
      });
  };
  
  /**
   * Search for cars based on criteria
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Array<Car>>} Promise resolving to array of matching cars
   */
  const searchCars = function(searchParams) {
    return $http.get('/api/cars/search', { params: searchParams })
      .then(function(response) {
        const cars = response.data.cars.map(function(carData) {
          return new Car(carData);
        });
        return cars;
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to search cars');
      });
  };
  
  /**
   * Get car categories
   * @returns {Promise<Array<string>>} Promise resolving to array of categories
   */
  const getCarCategories = function() {
    return $http.get('/api/cars/categories')
      .then(function(response) {
        return response.data.categories;
      })
      .catch(function(error) {
        return $q.reject(error.data ? error.data : 'Failed to fetch car categories');
      });
  };
  
  // Return factory API
  return {
    createCar: createCar,
    addCar: addCar,
    updateCar: updateCar,
    deleteCar: deleteCar,
    updateAvailability: updateAvailability,
    getOwnerCars: getOwnerCars,
    updatePrimaryImage: updatePrimaryImage,
    deleteImage: deleteImage,
    searchCars: searchCars,
    getCarCategories: getCarCategories,
    
  };
}]);