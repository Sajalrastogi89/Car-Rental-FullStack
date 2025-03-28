myApp
  .factory("LocationFactory",['$q','$http',function($q,$http){
  const metroCities=[
    "Delhi", "Mumbai", "Bengaluru", "Chennai", "Kolkata", "Hyderabad", 
    "Pune", "Ahmedabad", "Jaipur", "Chandigarh", "Lucknow", "Kochi", 
    "Bhopal", "Indore", "Surat", "Agra", "Patna", "Vadodara", "Goa", 
    "Shimla", "Rishikesh", "Manali", "Mussoorie", "Coimbatore", "Tiruchirappalli",
    "Jodhpur", "Udaipur", "Mysore", "Varanasi"
  ];

  return {
    getCityUsingGeolocation: function() {
      let deferred = $q.defer();

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
          let lat = position.coords.latitude;
          let lon = position.coords.longitude;
          let url = 'https://nominatim.openstreetmap.org/reverse?lat=' 
                    + lat + '&lon=' + lon + '&format=json';

          $http.get(url).then(function(response) {
            console.log("current city in location factory", response);
            let data = response.data;
            if (data && data.address) {
              let city = data.address.city || data.address.town || data.address.village;
              let state = data.address.state;
              
              if ((city && metroCities.indexOf(city) !== -1) || state === "Delhi") {
                if(city) city=city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
                deferred.resolve(city || "Delhi");
                console.log("city fetched", city);
              } else {
                deferred.resolve("Our service is not available in your location.");
              }
            } else {
              deferred.reject("Unable to fetch city data.");
            }
          }, function(error) {
            deferred.reject("Error fetching city.");
            console.error(error);
          });
        }, function(error) {
          deferred.reject("Error getting geolocation: " + error.message);
          console.error(error);
        });
      } else {
        deferred.reject("Geolocation not supported by this browser.");
      }
      
      // Return the promise
      return deferred.promise;
    }
  }}])