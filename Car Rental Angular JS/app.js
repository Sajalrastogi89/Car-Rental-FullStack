
const myApp = angular.module('myApp', ['ui.router','ui.bootstrap'
]);

myApp.run(['IndexedDBService',function(IndexedDBService) {

  IndexedDBService.openDB()
    .then(function(db) {
      console.log("Database initialized:", db);
    })
    .catch(function(error) {
      console.error("Error initializing database:", error);
    });

  //   (async function () {
  //     const cities = [
  //       "Delhi", "Mumbai", "Bengaluru", "Chennai"];
  
  //     const carModels = [
  //         { name: "Nexon", category: "SUV", fuelType: "Electric", basePrice: 500, pricePerKm: 15, travelled: 100 },
  //         { name: "Swift", category: "Hatchback", fuelType: "Petrol", basePrice: 300, pricePerKm: 10, travelled: 100  },
  //         { name: "Civic", category: "Sedan", fuelType: "Diesel", basePrice: 600, pricePerKm: 20, travelled: 100  },
  //             { name: "BMW", category: "Sedan", fuelType: "Electric", basePrice: 600, pricePerKm: 20, travelled: 100  }
  //     ];
  
  //     // Convert Image File to Blob
  //     async function fetchImageAsBlob(url) {
  //         let response = await fetch(url);
  //         return await response.blob();
  //     }
  
  //     // Preload image (Use a valid image URL or local image path)
  //     let carImageBlob = await fetchImageAsBlob("assets/img/car.jpeg");
  
  //     // Loop to add multiple cars
  //     for (let city of cities) {
  //         for (let model of carModels) {
  //             let car = {
  //                 ...model,
  //                 city: city,
  //                 features: ["Air Conditioning", "Power Steering", "ABS"],
  //                 image: carImageBlob, // Assign Blob image
  //                 owner: {
  //                     role: "owner",
  //                     firstName: "Sajal",
  //                     lastName: "Rastogi",
  //                     email: "sajal@gmail.com"
  //                 }
  //             };
  
  //             // Add car to IndexedDB
  //             await IndexedDBService.addRecord("cars", car);
  //             console.log(`Added ${model.name} in ${city}`);
  //         }
  //     }
  
  //     console.log("All cars added successfully!");
  // })();
  

}])