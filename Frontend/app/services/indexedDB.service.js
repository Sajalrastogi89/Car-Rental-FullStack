myApp.service("IndexedDBService", ["$q","utilFactory",function ($q,utilFactory) {
  let db;
  const dbName = "CarUserDB";
  const dbVersion = 1;

  /**
   * @description - this function will open database and if version is changed then upgrade
   * function will be called and previous data will be stored inside oldData object and old data stores
   * will be deleted and new data stores will be added
   * @returns db instance
   */
  this.openDB = function openDB() {
    if (db) return $q.resolve(db);

    let deferred = $q.defer();
    let request = indexedDB.open(dbName, dbVersion);

    request.onupgradeneeded = function (event) {
        db = event.target.result;
        let transaction = event.target.transaction;
        let storeNames = ["users", "cars", "biddings", "chat", "conversation"];
        let oldData = {};

        async.parallel(
            storeNames.map((storeName) => {
                return function (callback) {
                    if (db.objectStoreNames.contains(storeName)) {
                        let store = transaction.objectStore(storeName);
                        let getAllRequest = store.getAll();

                        getAllRequest.onsuccess = function (event) {
                            oldData[storeName] = event.target.result;
                            callback(null, oldData[storeName]);
                        };

                        getAllRequest.onerror = function (err) {
                            oldData[storeName] = [];
                            callback(err, null);
                        };
                    } else {
                        callback(null, []);
                    }
                };
            }),
            function (err, results) {
                if (err) {
                    console.error("Error fetching store data:", err);
                } else {
                    console.log("Fetched store data:", results);
                }
                storeNames.forEach((store) => {
                    if (db.objectStoreNames.contains(store)) db.deleteObjectStore(store);
                });
                createStores();
            }
        );

        function createStores() {
            // Users table with UUID as primary key
            let userStore = db.createObjectStore("users", { keyPath: "id" });
            userStore.createIndex("email", "email", { unique: true });
            userStore.createIndex("role", "role", { unique: false });

            // Cars table referencing UUID (removed autoIncrement)
            let carStore = db.createObjectStore("cars", { keyPath: "id" });
            carStore.createIndex("city", "city", { unique: false });
            carStore.createIndex("owner_id", "owner.id", { unique: false }); // Uses UUID

            // Biddings table referencing UUIDs (removed autoIncrement)
            let biddingStore = db.createObjectStore("biddings", { keyPath: "id" });
            biddingStore.createIndex("car_id", "car.id", { unique: false });
            biddingStore.createIndex("user_id", "user.id", { unique: false });
            biddingStore.createIndex("owner_id", "car.owner.id", { unique: false });
            biddingStore.createIndex("status", "status", { unique: false });

            // Chat table referencing UUIDs (removed autoIncrement)
            let chatStore = db.createObjectStore("chat", { keyPath: "id" });
            chatStore.createIndex("user_id", "user.id", { unique: false });
            chatStore.createIndex("owner_id", "owner.id", { unique: false });

            // Conversation table referencing UUIDs (removed autoIncrement)
            let conversationStore = db.createObjectStore("conversation", { keyPath: "id" });
            conversationStore.createIndex("chat_id", "chat_id", { unique: false });
        }
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        deferred.resolve(db);
    };

    request.onerror = function (event) {
        deferred.reject(event.target.error);
    };

    return deferred.promise;
};


  /**
   * @description - this function will add records inside database
   * @param {String} storeName
   * @param {Object} record
   * @returns {Object}
   */
  this.addRecord = function (storeName, record) {
    record.id=utilFactory.generate();
    console.log("record",record);
    let deferred=$q.defer();
    this.openDB().then(function (db) {
      let tx = db.transaction(storeName, "readwrite");
      let store = tx.objectStore(storeName);
        let request = store.add(record);

        request.onsuccess = function (event) {
          deferred.resolve(event.target.result);
          console.log("added record",event.target.result);
        };
        request.onerror = function (event) {
          deferred.reject(event.target.error);
        };
      }
      )
      .catch((e)=>{
        deferred.reject(e);
      })
    return deferred.promise;
  };

  /**
   * @description - this function will retrieve records inside database
   * @param {String} storeName
   * @param {Integer} record
   * @returns {Object}
   */
  this.getRecord = function (storeName, key) {
    let deferred=$q.defer();
    this.openDB()
    .then(function (db) {
      console.log(1);
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
        let request = store.get(key);

        request.onsuccess = function (event) {
          console.log("db get record",event.target.result);
          deferred.resolve(event.target.result);
        };
        request.onerror = function (event) {
          console.log(2);
          deferred.reject(event.target.error);
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };

  /**
   * @description - this will fetch all records from database
   * @param {String} storeName
   * @returns
   */

  this.getAll = function (storeName) {
    let deferred=$q.defer();
    this.openDB()
    .then(function (db) {
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
        let request = store.getAll();
        request.onsuccess = function (event) {
          deferred.resolve(event.target.result);
        };
        request.onerror = function (event) {
          deferred.reject(event.target.error);
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };

  /**
   * @description - This will update existing record
   * @param {String} storeName
   * @param {Object} record
   * @returns {Object} updated record
   */
  this.updateRecord = function (storeName, record) {
    let deferred=$q.defer();
    this.openDB()
    .then(function (db) {
      let tx = db.transaction(storeName, "readwrite");
      let store = tx.objectStore(storeName);
        let request = store.get(record.id);

        request.onsuccess = function (event) {
          let existingRecord = event.target.result;
          console.log("exsisting frecord",existingRecord);
          if (!existingRecord) {
            return deferred.reject(new Error("Record not found"));
          }
          let mergedRecord = { ...existingRecord, ...record };
          console.log("merged record",mergedRecord);
          let updateRecord = store.put(mergedRecord);
          updateRecord.onsuccess = function () {
            deferred.resolve(mergedRecord);
          };
          updateRecord.onerror = function () {
            deferred.reject(new Error("Failed to update record: " + event.target.error));
          };
        };
        request.onerror = function (event) {
          deferred.reject(new Error("Failed to fetch record: " + event.target.error));
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };



  /**
 * @description - This will delete a record by id
 * @param {String} storeName - The name of the object store
 * @param {String|Number} id - The primary key of the record to delete
 * @returns {Promise} - Resolves with success, rejects with error
 */
this.deleteRecord = function (storeName, id) {
  let deferred = $q.defer();
  
  this.openDB()
    .then(function (db) {
      let tx = db.transaction(storeName, "readwrite");
      let store = tx.objectStore(storeName);
      
      // First check if record exists
      let getRequest = store.get(id);
      
      getRequest.onsuccess = function(event) {
        const record = event.target.result;
        
        if (!record) {
          deferred.reject(new Error("Record not found with id: " + id));
          return;
        }
        
        // Record exists, proceed with deletion
        let deleteRequest = store.delete(id);
        
        deleteRequest.onsuccess = function() {
          // Return the deleted record for potential use by the caller
          deferred.resolve({ 
            success: true, 
            deletedRecord: record,
            message: "Record successfully deleted"
          });
        };
        
        deleteRequest.onerror = function(event) {
          deferred.reject(new Error("Failed to delete record: " + event.target.error));
        };
      };
      
      getRequest.onerror = function(event) {
        deferred.reject(new Error("Failed to check record existence: " + event.target.error));
      };
      
      // Handle transaction errors
      tx.onerror = function(event) {
        deferred.reject(new Error("Transaction error: " + event.target.error));
      };
    })
    .catch(function(e) {
      deferred.reject(new Error("Database error: " + e.message));
    });
  
  return deferred.promise;
};


  this.getFirstRecordByIndex = function (storeName, indexName, indexValue) {
    let deferred = $q.defer();

    this.openDB()
        .then(function (db) {
            let transaction = db.transaction([storeName], "readonly");
            let store = transaction.objectStore(storeName);
            let index = store.index(indexName);
            
            // Use KeyRange.only to match the exact index value
            let request = index.openCursor(IDBKeyRange.only(indexValue));

            request.onsuccess = function (event) {
                let cursor = event.target.result;
                if (cursor) {
                    deferred.resolve(cursor.value); // Return the first matching record
                } else {
                    deferred.resolve(null); // No matching record found
                }
            };

            request.onerror = function (event) {
                deferred.reject(event.target.error);
            };
        })
        .catch((e) => {
            deferred.reject(e);
        });

    return deferred.promise;
};



  /**
   * @description - this will fetch records of a particular index
   * @param {String} storeName
   * @param {String} indexName
   * @param {*} indexValue
   * @returns - array of objects
   */
  this.getRecordsUsingIndex = function (storeName, indexName, indexValue) {
    let deferred=$q.defer();
    this.openDB()
    .then(function (db) {
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
      let index = store.index(indexName);
        let getRequest = index.getAll(indexValue);

        getRequest.onsuccess = function (event) {
          deferred.resolve(event.target.result);
        };
        getRequest.onerror = function (event) {
          deferred.reject(event.target.error);
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };

  /**
   * @description - this will fetch fixed number of records
   * @param {String} storeName
   * @param {Number} pageSize
   * @param {Number} start
   * @returns - array of objects
   */
  this.getRecordsUsingPagination = function (storeName, pageSize, start) {
    let deferred=$q.defer();
      this.openDB()
      .then(function (db) {
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
      let records = [];
        let cursorRequest = store.openCursor();
        cursorRequest.onsuccess = function (event) {
          let cursor = event.target.result;
          if (!cursor) {
            deferred.resolve(records);
            return;
          }
          if (start > 0) {
            cursor.advance(start);
            start = 0;
          } else if (records.length < pageSize) {
            records.push(cursor.value);
            cursor.continue();
          } else {
            deferred.resolve(records);
          }
        };
        cursorRequest.onerror = function (event) {
          deferred.reject(event.target.error);
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };

  /**
   * @description - this will fetch records form table on particular index with pagination
   * @param {String} storeName
   * @param {String} indexName
   * @param {*} indexValue
   * @param {Number} pageSize
   * @param {Number} start
   * @returns - array of objects
   */
  this.getRecordsUsingPaginationWithIndex = function (
    storeName,
    indexName,
    indexValue,
    pageSize,
    start
  ) {
    let deferred=$q.defer();
    this.openDB()
    .then(function (db) {
      let tx = db.transaction(storeName, "readonly");
      let store = tx.objectStore(storeName);
      let index = store.index(indexName);
      let records = [];
      console.log(indexValue);
        let cursorRequest = index.openCursor(IDBKeyRange.only(indexValue));
        cursorRequest.onsuccess = function (event) {
          let cursor = event.target.result;
          if (!cursor) {
            deferred.resolve(records);
            return;
          }
          if (start > 0) {
            cursor.advance(start);
            start = 0;
          } else if (records.length < pageSize) {
            records.push(cursor.value);
            cursor.continue();
          } else {
            deferred.resolve(records);
          }
        };
        cursorRequest.onerror = function (event) {
          deferred.reject(event.target.error);
        };
    })
    .catch((e)=>{
      deferred.reject(e);
    })
    return deferred.promise;
  };
}]);
