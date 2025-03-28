myApp.controller("ownerChatController", ["$scope", "chatService", "$timeout", 
  function ($scope, chatService, $timeout) {
    // Basic data initialization
    $scope.chats = []; 
    $scope.messages = [];
    $scope.currentMessage = { messageText: "" };
    $scope.selectedChat = null;
    $scope.isLoading = false;
    let socket;
    
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
      socket = io("http://localhost:8000");

      socket.on("newMessage", function (data) {
        console.log("Message received in new message ", data);
        if ($scope.selectedChat && data.chatId === $scope.selectedChat._id) {
          $timeout(function () {
            $scope.messages.push(data);
            scrollToBottom();
          });
        }
      });

      $scope.getAllChats()
        .finally(() => {
          $scope.isLoading = false;
        });
    };
  
    /**
     * @description - Fetch all chats for the owner
     */
    $scope.getAllChats = function() {
      return chatService.getChats()
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
    
    
      socket.emit("joinChat", chat._id); // chat._id acts as the room ID
    
      chatService.getSelectedChatData(chat._id)
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
        console.log("image");
        // Handle image message
        sendImageMessage(messageText);
      } else {
        // Handle text message
        sendTextMessage(messageText);
      }
    };
    
    /**
     * @description - Send a text message
     */
    function sendTextMessage(messageText) {
      console.log("selected chat owner id", $scope.selectedChat);
     
      let formData = new FormData();
      formData.append('message', messageText);
      // Create message data
      // let messageData = {
      //   message: messageText,
      //   chatId: $scope.selectedChat._id,
      //   sender: $scope.selectedChat.owner._id,
      //   createdAt: new Date()
      // };
      
      
      // Save to database
      chatService.addNewMessage($scope.selectedChat._id, formData)
      .then((messageData) => {    
        socket.emit("sendMessage", messageData.data);
        console.log("message sent", messageData.data);
        // Clear the message input after sending
        $scope.currentMessage.messageText = "";
      })
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
    function sendImageMessage(messageText) {
      if (!$scope.imagePreviewUrl) {
        return;
      }
      
      // Set loading state
      $scope.uploadingImage = true;
      const formData = new FormData();
      formData.append('image', $scope.imageToUpload);
      formData.append('message', messageText);
      
      // Save to database
      chatService.addNewMessage($scope.selectedChat._id, formData)
      .then((messageData) => {
        console.log("image sent", messageData);
        socket.emit("sendMessage", messageData.data);
        // Clear the message input after sending
        $scope.currentMessage.messageText = "";
      })
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