myApp.factory("utilFactory", function () {
  let factory = {};


  factory.generate = function () {
    return uuid.v4();
  }

  factory.hash = function(password) {
    console.log(12);
    return CryptoJS.SHA256(password).toString();
  }


  factory.verify = function(password, hash) {
    return CryptoJS.SHA256(password).toString() === hash;
  }

  return factory;



});
