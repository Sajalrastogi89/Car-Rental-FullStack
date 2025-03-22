myApp.controller("carController", [
  "$stateParams",
  "$state",
  "IndexedDBService",
  "$scope",
  "ToastService",
  "blobFactory",
  "chatService",
  "$q",
  function (
    $stateParams,
    $state,
    IndexedDBService,
    $scope,
    ToastService,
    blobFactory,
    chatService,
    $q
  ) {
    $scope.car = {}; // declaration for single car
    $scope.today = new Date().toISOString().split("T")[0]; // fetches todays date


    /**
     * @description - this will run when page is loaded and fetch car details using car id
     */
    $scope.init = function () {
      $scope.isLoading = true;
      getCarById()
        .then((car) => {
          $scope.car = car;
        })
        .catch((e) => {
          ToastService.error(e,3000);
          console.log(e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };


    /**
     * @description - fetch car data using car_id and convert blob to temporary image url
     */
    function getCarById() {
      let deferred=$q.defer();
      let carId = $stateParams.id;
      IndexedDBService.getRecord("cars", carId)
        .then((car) => {
          console.log("car",car);
          if (car.image instanceof Blob && car.image.size > 0)
            car.image = URL.createObjectURL(car.image);
          deferred.resolve(car);
        })
        .catch((e) => {
          deferred.reject(e);
        });
        return deferred.promise;
    }

   


    /**
     * @description - check availability of car from approved array present in car object
     * if date is available then clone of car object will be created and image url 
     * is converted into blob and then biddingCar object will be stored inside database and user will be
     * redirected to biddings page
     */
    $scope.checkAvailability = function () {
      const start = new Date($scope.car.startDate);
      const end = new Date($scope.car.endDate);

      if(!$scope.car.startDate || !$scope.car.endDate || 
        start < new Date().setHours(0,0,0,0) || 
        start > end)
      {
        ToastService.error("Choose correct dates", 3000);
        return;
      }

      
      let bidAmount; // Variable to store bid amount

      IndexedDBService.getRecord("cars", $scope.car.id)
        .then((car) => {
          // Check availability
          if (car.approved) {
            for (const dateRange of car.approved) {
              let minDate = dateRange.startDate;
              let maxDate = dateRange.endDate;
              if (start <= maxDate && end >= minDate) {
                throw new Error("Dates not available");
              }
            }
          }
          return blobFactory.getImage($scope.car.image);
        })
        .then((imageBlob) => {
          const user = JSON.parse(sessionStorage.getItem("loginData"));
          const biddingCar = structuredClone($scope.car);
          biddingCar.image = imageBlob;
          
          // Calculate bid amount
          const days = $scope.calculateDays();
          bidAmount = biddingCar.basePrice * days;
          
          const biddingObject = {
            car: biddingCar,
            user: user,
            timestamp: Date.now(),
            status: "pending",
            paymentStatus: false,
            bidAmount: bidAmount, // Store the bid amount
            days: days
          };
          
          return IndexedDBService.addRecord("biddings", biddingObject);
        })
        .then(() => {
          
          // Create chat with owner
          const user = JSON.parse(sessionStorage.getItem("loginData"));
          const user_id = user.id;
          const userName = user.firstName + " " + user.lastName;
          const ownerName = $scope.car.owner.name;
          const owner_id = $scope.car.owner.id;
          
          // Custom first message with bid details
          const bidMessage = `I've placed a bid of ₹${bidAmount} for your ${$scope.car.name} from ${new Date($scope.car.startDate).toISOString().split('T')[0]} to ${new Date($scope.car.endDate).toISOString().split('T')[0]}.`;
          
          // Create or get existing chat
          return chatService.addChat(userName, ownerName, owner_id, user_id, $scope.car, bidMessage);
        })
        .then((chatResult) => {
          // Show appropriate toast message based on whether chat was new or existing
          if (chatResult.isNew) {
            ToastService.success("Bid placed and chat created with owner", 3000);
          } else {
            ToastService.success("Bid placed and message sent in existing chat", 3000);
          }
          
          // Navigate to biddings page
          $state.go("userBiddings");
        })
        .catch((e) => {
          ToastService.error(e.message, 3000);
        })
    };


    /**
     * @description - this will create a new chat with car owner and 'Hi' will be send to owner
     * @param {Integer} owner_id
     * @param {Object} car 
     */
    $scope.chat = function (ownerName,owner_id, car) {
      const user = JSON.parse(sessionStorage.getItem("loginData"));
      const user_id=user.id;
      const userName=user.firstName;
      chatService
        .addChat(userName, ownerName, owner_id, user_id, car)
        .then((result) => {
          if (result.isNew) {
            ToastService.success("New chat created", 3000);
          } else {
            ToastService.info("Chat already exists", 3000);
          }
          
        })
        .catch((error) => {
          ToastService.error("Failed to create chat", 3000);
          console.error(error);
        })
    };

    /**
     * @description - Calculates the number of days between selected start and end dates
     * @returns {number} - Number of days for the booking
     */
    $scope.calculateDays = function () {
      if (!$scope.car.startDate || !$scope.car.endDate) return 0;
      
      // Create date objects
      const start = new Date($scope.car.startDate);
      const end = new Date($scope.car.endDate);
      
      const Diff = Math.abs(end - start);
      
      // Convert to days and add 1 to include both start and end date
      const diffDays = Math.ceil(Diff / (1000 * 3600 * 24)) + 1;
      
      return diffDays; // Return at least 1 day
    };

    /**
     * @description - Calculates the total price based on number of days and base price
     * @returns {number} - Total booking price
     */
    $scope.calculatePrice = function () {
      const days = $scope.calculateDays();
      const basePrice = $scope.car.basePrice || 0;
      
      // Calculate total price
      const totalPrice = basePrice * days;
      
      return totalPrice;
    };
    
  },
]);
