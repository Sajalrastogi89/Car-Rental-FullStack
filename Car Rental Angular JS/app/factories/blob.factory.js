myApp.factory('blobFactory',["$http","$q",function($http,$q){
  return{
    getImage: function(imageUrl){
      let deferred=$q.defer();
      $http({
        method: "GET",
        url: imageUrl,
        responseType: "blob",
      })
      .then(function(response){
        deferred.resolve(response.data);
      })
      .catch(function(error){
        deferred.reject(error);
      });
      return deferred.promise;
    }
  }
}])