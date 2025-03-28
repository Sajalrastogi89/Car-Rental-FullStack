myApp.service("chatService", [
  "IndexedDBService",
  "$q",
  "ToastService",
  "$http",
  function (IndexedDBService, $q, ToastService, $http) {

    /**
     * @description - Creates a new chat or returns existing chat between users
     * @param {String} userName 
     * @param {String} ownerName 
     * @param {String} owner_id 
     * @param {String} user_id 
     * @param {Object} car
     * @param {String} customMessage - Optional custom first message 
     * @returns {Promise} resolves with {chatId, isNew, message}
     */
    this.addChat = function (owner, car) {
      let deferred = $q.defer();
      let chatObject = {
        "car":car,
        "owner":owner,
      };
      console.log("chat object", chatObject);
      $http.post("http://localhost:8000/api/chat/addNewChat",chatObject) 
      .then((response) => {
        socket = io("http://127.0.0.1:8080");
        socket.emit("joinChat", response.data._id);
        deferred.resolve(response.data);
      }
      )
      .catch((e) => {
        console.error("Error adding chat:", e);
        deferred.reject(e);
      }
      );
        
      return deferred.promise;
    };

    /**
     * @description - Checks if a chat already exists between the specified owner and user
     * @param {String} owner_id 
     * @param {String} user_id 
     * @returns {Promise} resolves with existing chat object or null
     */
    this.checkExistingChat = function(owner_id, user_id) {
      let deferred = $q.defer();
      
      // Get all chats for this owner
      IndexedDBService.getRecordsUsingIndex("chat", "owner_id", owner_id)
        .then((ownerChats) => {
          // Filter to find chats with the specific user
          const existingChat = ownerChats.find(chat => 
            chat.owner.id === owner_id && chat.user.id === user_id
          );
          
          deferred.resolve(existingChat || null);
        })
        .catch((e) => {
          console.error("Error checking existing chats:", e);
          deferred.reject(e);
        });
        
      return deferred.promise;
    };

    /**
     * @description - this will get chats related to user from database 
     * @param {String} indexName 
     * @returns array of objects
     */
    this.getChats = function(){
      let deferred=$q.defer();
      $http
      .get("http://localhost:8000/api/chat/getChats")
      .then((response)=>{
        console.log("allChats",response.data);
        deferred.resolve(response.data);
      }).catch((e)=>{
        deferred.reject(e);
      })
      return deferred.promise;
    }

    /**
     * @description - this will fetch convertation related to that chat id
     * @param {Number} id 
     * @returns array of objects
     */
    this.getSelectedChatData = function(id){
      console.log("getSelectedChat");
      let deferred=$q.defer();
     $http.get(`http://localhost:8000/api/chat/getConversation/${id}`)
      .then((allConversation)=>{
        console.log(allConversation);
        deferred.resolve(allConversation.data);
      }).catch((e)=>{
        deferred.reject(e);
      })
      return deferred.promise;
    }

    /**
     * @description - this will add new message to database
     * @param {Object} messageData 
     * @returns {Object|String}
     */
    this.addNewMessage = function(id,messageData){
      let deferred=$q.defer();    
      let config = {
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      };
      $http.post(`http://localhost:8000/api/chat/sendMessage/${id}`,messageData, config).then((messageData)=>{
        
        deferred.resolve(messageData.data);
      })
      .catch((e)=>{
        deferred.reject("message not added");
      })
     return deferred.promise;
    }

  },
]);
