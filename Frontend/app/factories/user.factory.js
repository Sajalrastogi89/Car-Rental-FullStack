/**
 * UserFactory - A service that provides user validation for signup and login
 * Uses prototype pattern for efficient method sharing
 */
myApp.factory('UserFactory', ['$http', '$q', "AuthService", function($http, $q, AuthService) {
  
  /**
   * User constructor function
   * @param {Object} userData - User data object
   */
  function User(userData) {
    // Initialize with empty object if no data provided
    userData = userData || {};
    
    // Basic user properties needed for authentication
    this.firstName = userData.firstName || '';
    this.lastName = userData.lastName || '';
    this.email = userData.email || '';
    this.password = userData.password || '';
    this.confirmPassword = userData.confirmPassword || '';
    this.phone = userData.phone || '';
    this.role = userData.role || 'user'; // default role
  }
  
  /**
   * Validate email format
   * @returns {Object} Validation result
   */
  User.prototype.validateEmail = function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!this.email) {
      return {
        isValid: false,
        message: 'Email is required'
      };
    }
    
    if (!emailRegex.test(this.email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address'
      };
    }
    
    return {
      isValid: true,
      message: 'Email is valid'
    };
  };
  
  /**
   * Validate password strength
   * @returns {Object} Validation result
   */
  User.prototype.validatePassword = function() {
    if (!this.password) {
      return {
        isValid: false,
        message: 'Password is required'
      };
    }
    
    if (this.password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long'
      };
    }
    
    // Check for password complexity (at least one uppercase, one lowercase, one number)
    const hasUppercase = /[A-Z]/.test(this.password);
    const hasLowercase = /[a-z]/.test(this.password);
    const hasNumber = /[0-9]/.test(this.password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);
    
    if (!(hasUppercase && hasLowercase && hasNumber)) {
      return {
        isValid: false,
        message: 'Password must include at least one uppercase letter, one lowercase letter, and one number'
      };
    }
    
    // Bonus: Suggest adding a special character if not present
    if (!hasSpecial) {
      return {
        isValid: true,
        message: 'Password is valid, but adding a special character would make it stronger',
        suggestion: true
      };
    }
    
    return {
      isValid: true,
      message: 'Password is strong'
    };
  };
  
  /**
   * Validate password confirmation match
   * @returns {Object} Validation result
   */
  User.prototype.validatePasswordMatch = function() {
    if (!this.confirmPassword) {
      return {
        isValid: false,
        message: 'Please confirm your password'
      };
    }
    
    if (this.password !== this.confirmPassword) {
      return {
        isValid: false,
        message: 'Passwords do not match'
      };
    }
    
    return {
      isValid: true,
      message: 'Passwords match'
    };
  };
  
  /**
   * Validate phone number format for signup
   * @returns {Object} Validation result
   */
  User.prototype.validatePhone = function() {
    // Allow formats like: +91 9876543210, 9876543210, 987-654-3210
    const phoneRegex = /^(\+\d{1,3}\s?)?\d{10}$|^\d{3}[-.]?\d{3}[-.]?\d{4}$/;
    
    if (!this.phone) {
      return {
        isValid: false,
        message: 'Phone number is required'
      };
    }
    
    if (!phoneRegex.test(this.phone)) {
      return {
        isValid: false,
        message: 'Please enter a valid phone number'
      };
    }
    
    return {
      isValid: true,
      message: 'Phone number is valid'
    };
  };
  
  /**
   * Validate user's name for signup
   * @returns {Object} Validation result
   */
  User.prototype.validateName = function() {
    if (!this.firstName || !this.lastName) {
      return {
        isValid: false,
        message: 'Both first name and last name are required'
      };
    }
    
    if (this.firstName.length < 2 || this.lastName.length < 2) {
      return {
        isValid: false,
        message: 'Names must be at least 2 characters long'
      };
    }
    
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(this.firstName) || !nameRegex.test(this.lastName)) {
      return {
        isValid: false,
        message: 'Names should contain only letters, spaces, apostrophes, and hyphens'
      };
    }
    
    return {
      isValid: true,
      message: 'Name is valid'
    };
  };
  
  /**
   * Validate user input for login
   * @returns {Object} Validation results with overall isValid flag
   */
  User.prototype.validateLogin = function() {
    const validations = {
      email: this.validateEmail(),
      password: {
        isValid: !!this.password,
        message: this.password ? 'Password provided' : 'Password is required'
      }
    };
    
    // Check if all validations passed
    const isValid = Object.values(validations).every(v => v.isValid);
    
    return {
      isValid: isValid,
      validations: validations
    };
  };
  
  /**
   * Validate user input for signup
   * @returns {Object} Validation results with overall isValid flag
   */
  User.prototype.validateSignup = function() {
    const validations = {
      email: this.validateEmail(),
      name: this.validateName(),
      password: this.validatePassword(),
      passwordMatch: this.validatePasswordMatch(),
      phone: this.validatePhone()
    };
    
    // Check if all validations passed
    const isValid = Object.values(validations).every(v => v.isValid);
    
    return {
      isValid: isValid,
      validations: validations
    };
  };
  
  /**
   * Get full name
   * @returns {string} User's full name
   */
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  const createUser = function(data) {
    const user = new User(data);
    return user;
  };
  

  
  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise<Object>} Promise resolving to login result
   */
  const login = function(credentials) {
    let deferred = $q.defer();

    const user = new User(credentials);
    const validation = user.validateLogin();
    
    if (!validation.isValid) {
      return deferred.reject({
        success: false,
        message: 'Invalid login data',
      });
    }

    AuthService.loginUser(credentials).then((response) => {
      localStorage.setItem('token', response.auth.token);
      deferred.resolve({
        success: true,
        message: 'Login successful',
        user: response.user
      });
    }
    ).catch((error) => {
      deferred.reject({
        success: false,
        message: 'Error logging in'
      });
    });
    return deferred.promise;
  };
  
  /**
   * Register a new user
   * @param {User} user - User instance with registration data
   * @returns {Promise<Object>} Promise resolving to registration result
   */
  const signup = function(data) {

    let deferred = $q.defer();

    // Validate signup data
    const user = new User(data);
    const validation = user.validateSignup();

    if (!validation.isValid) {
      return deferred.reject({
        success: false,
        message: 'Invalid signup data'
      });
    }

    if (user.role === "user") {
      user.verified = true;
    } else if (user.role === "owner") {
      user.verified = false;
    }

    // setting name
    user.name = user.getFullName();

    // delete unnecessary fields
    delete user.confirmPassword;
    delete user.firstName;
    delete user.lastName;

    AuthService.registerUser(user)
    .then((response) => {
      deferred.resolve({
        success: true,
        message: 'User created'
      });
    })
    .catch((error) => {
      deferred.reject({
        success: false,
        message: 'Error adding user'
      });
    });
    
   return deferred.promise;
  };
  

  
  // Return factory API
  return {
    createUser: createUser,
    loginUser: login,
    addUser: signup,
  };
}]);