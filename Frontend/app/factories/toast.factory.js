myApp.factory("ToastService", [function () {

  let factory={};

  const defaultOptions={
    close: true,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true
  };

  factory.onSuccess = function(message,time){
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#4caf50'
    }).showToast();
  }

  factory.error = function(message,time){
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#f44336'
    }).showToast();
  }

  factory.success = function(message,time){
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#4caf50'
    }).showToast();
  }

  factory.info = function(message,time){
    Toastify({
      ...defaultOptions,
      duration: time,
      text: message,
      backgroundColor: '#4caf50'
    }).showToast();
  }

  return factory;
}]);
