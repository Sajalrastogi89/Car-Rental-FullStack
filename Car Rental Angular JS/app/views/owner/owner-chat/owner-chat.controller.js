myApp.controller("ownerChatController", ["$scope", "chatService", "$timeout", 
  function ($scope, chatService, $timeout) {
    // Basic data initialization
    $scope.chats = []; 
    $scope.messages = [];
    $scope.currentMessage = { messageText: "" };
    $scope.selectedChat = null;
    $scope.isLoading = false;
    
    // Get owner ID from session storage
    const ownerData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    $scope.ownerId = ownerData.id || ownerData.email;
    
    // Image handling variables
    $scope.imageToUpload = null;
    $scope.imagePreviewUrl = null;
    $scope.imageModalUrl = null;
    $scope.uploadingImage = false;

    /**
     * @description - Initialize controller
     */
    $scope.init = function() {
      $scope.isLoading = true;
      
      $scope.getAllChats()
        .finally(() => {
          $scope.isLoading = false;
        });
    };
  
    /**
     * @description - Fetch all chats for the owner
     */
    $scope.getAllChats = function() {
      return chatService.getChats("owner_id")
        .then((allChats) => {
          console.log(allChats);
          $scope.chats = allChats || [];
        })
        .catch((e) => {
          console.log("Error fetching chats:", e);
        });
    };
  
    /**
     * @description - Select a chat and load its messages
     */
    $scope.selectChat = function(chat) {
      $scope.selectedChat = chat;
      
      // Clear previous messages and image data
      $scope.messages = [];
      $scope.cancelImageUpload();
      $scope.isLoading = true;
      
      chatService.getSelectedChatData(chat.id)
        .then((conversation) => {
          $scope.messages = conversation || [];
          
          // Scroll to bottom of messages after they load
          $timeout(function() {
            scrollToBottom();
          }, 100);
        })
        .catch((e) => {
          console.log("Error loading conversation:", e);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };
  
    /**
     * @description - Send message (text or image)
     */
    $scope.sendMessage = function(messageText) {
      if (!$scope.selectedChat) {
        return;
      }
      
      // Don't send if no text AND no image
      if ((!messageText || !messageText.trim()) && !$scope.imageToUpload) {
        return;
      }
      
      if ($scope.imageToUpload) {
        // Handle image message
        sendImageMessage();
      } else {
        // Handle text message
        sendTextMessage(messageText);
      }
    };
    
    /**
     * @description - Send a text message
     */
    function sendTextMessage(messageText) {
                         
      // Create message data
      let messageData = {
        chat_id: $scope.selectedChat.id, 
        sender: $scope.ownerId,
        message: messageText,
        timestamp: Date.now(),
        isImage: false
      };
  
      // Add to UI immediately
      $scope.messages.push(messageData);
      $scope.currentMessage.messageText = "";
      
      // Scroll to bottom after sending message
      scrollToBottom();
      
      // Save to database
      chatService.addNewMessage(messageData)
        .catch((error) => {
          console.error("Error saving message:", error);
        });
    }
    
    /**
     * @description - Handle file selection
     */
    $scope.prepareImageUpload = function(element) {
      if (!element.files || !element.files[0]) {
        return;
      }
      
      const file = element.files[0];
      
      // Validate image
      if (!isValidImage(file)) {
        alert("Please select a valid image file (JPG, PNG or GIF) under 5MB.");
        element.value = '';
        return;
      }
      
      // Process the image
      $scope.imageToUpload = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = function(e) {
        $timeout(function() {
          $scope.imagePreviewUrl = e.target.result;
        });
      };
      
      reader.onerror = function() {
        alert("Error preparing image. Please try again.");
        $scope.cancelImageUpload();
      };
      
      reader.readAsDataURL(file);
    };
    
    /**
     * @description - Cancel image upload
     */
    $scope.cancelImageUpload = function() {
      $scope.imageToUpload = null;
      $scope.imagePreviewUrl = null;
      
      // Clear file input
      const fileInput = document.getElementById('imageUpload');
      if (fileInput) {
        fileInput.value = '';
      }
    };
    
    /**
     * @description - Send an image message
     */
    function sendImageMessage() {
      if (!$scope.imagePreviewUrl) {
        return;
      }
      
      // Set loading state
      $scope.uploadingImage = true;
      
      
      // Create message data
      let messageData = {
        chat_id: $scope.selectedChat.id,
        sender: $scope.ownerId,
        message: $scope.imagePreviewUrl,
        timestamp: Date.now(),
        isImage: true
      };
      
      // Add to UI immediately
      $scope.messages.push(messageData);
      scrollToBottom();
      
      // Save to database
      chatService.addNewMessage(messageData)
        .catch((error) => {
          console.error("Error sending image:", error);
        })
        .finally(() => {
          $scope.uploadingImage = false;
          $scope.cancelImageUpload();
        });
    }
    
    /**
     * @description - Handle Enter key for sending messages
     */
    $scope.handleKeyPress = function(event) {
      if (event.keyCode === 13 && !event.shiftKey) {
        event.preventDefault();
        $scope.sendMessage($scope.currentMessage.messageText);
        console.log("image");
      }
    };
    
  
    /**
     * @description - Scroll to bottom of messages
     */
    function scrollToBottom() {
      $timeout(function() {
        const container = document.getElementById('messagesContainer');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 20);
    }
    
    /**
     * @description - Validate image file
     */
    function isValidImage(file) {
      // Check type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return false;
      }
      
      // Check size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return false;
      }
      
      return true;
    }
    
   

    // Initialize
    $scope.init();
  }]);