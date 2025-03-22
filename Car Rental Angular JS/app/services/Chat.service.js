myApp.service("chatService", [
  "IndexedDBService",
  "$q",
  "ToastService",
  function (IndexedDBService,$q,ToastService) {

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
    this.addChat = function (userName, ownerName, owner_id, user_id, car, customMessage) {
      let deferred = $q.defer();
      
      // First check if a chat already exists between these users
      this.checkExistingChat(owner_id, user_id)
        .then((existingChat) => {
          // If chat already exists, add the new message to the existing chat
          if (existingChat) {
            // If we have a custom message, add it to the existing chat
            if (customMessage) {
              let messageData = {
                chat_id: existingChat.id, 
                sender: user_id,
                message: customMessage,
                timestamp: Date.now(),
              };
              
              return IndexedDBService.addRecord("conversation", messageData)
                .then(() => {
                  deferred.resolve({
                    chatId: existingChat.id,
                    isNew: false,
                    message: "Message added to existing chat"
                  });
                });
            } else {
              // No custom message, just return the existing chat
              deferred.resolve({
                chatId: existingChat.id,
                isNew: false,
                message: "Chat already exists"
              });
            }
          } else {
            // No existing chat found, create a new one
            let chatData = {
              user: { id: user_id, name: userName },
              owner: { id: owner_id, name: ownerName },
              car: car
            };

            IndexedDBService.addRecord("chat", chatData)
              .then((chatId) => {
                let messageData = {
                  chat_id: chatId, 
                  sender: user_id,
                  message: customMessage || "Hi", // Use custom message or default "Hi"
                  timestamp: Date.now(),
                };

                return IndexedDBService.addRecord("conversation", messageData)
                  .then(() => {
                    deferred.resolve({
                      chatId: chatId,
                      isNew: true,
                      message: "New chat created"
                    });
                  });
              })
              .catch((e) => {
                deferred.reject(e);
              });
          }
        })
        .catch((e) => {
          deferred.reject(e);
        });
        
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
    this.getChats = function(indexName,indexValue){
      let deferred=$q.defer();
      IndexedDBService.getRecordsUsingIndex("chat",indexName,indexValue).then((allChats)=>{
        console.log("allChats",allChats);
        deferred.resolve(allChats);
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
      IndexedDBService.getRecordsUsingIndex("conversation","chat_id",id).then((allConversation)=>{
        console.log(allConversation);
        deferred.resolve(allConversation);
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
    this.addNewMessage = function(messageData){
      let deferred=$q.defer();    
      IndexedDBService.addRecord("conversation", messageData).then((messageData)=>{
        deferred.resolve(messageData);
      })
      .catch((e)=>{
        deferred.reject("message not added");
      })
     return deferred.promise;
    }

  },
]);
