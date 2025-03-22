/**
 * Edit Car Price Modal Component
 * 
 * Simple modal to edit the base price of a car
 * Usage: Opens via $uibModal service
 */
myApp.component("editCarPriceModal", {
  template: `
    <div class="modal-header">
      <button type="button" class="close" ng-click="$ctrl.dismiss()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <h3 class="modal-title">
        <i class="fa fa-money text-success" style="margin-right: 10px;"></i>
        Edit Price
      </h3>
    </div>
    
    <div class="modal-body">
      <div class="row">
        <div class="col-md-12">
          <div class="alert alert-info">
            <i class="fa fa-info-circle"></i> 
            Updating the base price will affect all future bookings for this car.
          </div>
          
          <div class="form-group">
            <label>Car Name</label>
            <input type="text" class="form-control" ng-model="$ctrl.resolve.car.name" disabled>
          </div>
          
          <div class="form-group">
            <label>Current Price (per day)</label>
            <div class="input-group">
              <span class="input-group-addon"><i class="fa fa-inr"></i></span>
              <input type="text" class="form-control" ng-model="$ctrl.resolve.car.basePrice" disabled>
            </div>
          </div>
          
          <div class="form-group">
            <label>New Price (per day)</label>
            <div class="input-group">
              <span class="input-group-addon"><i class="fa fa-inr"></i></span>
              <input type="number" 
                     class="form-control" 
                     ng-model="$ctrl.resolve.newPrice" 
                     
                     required
                     placeholder="Enter new price">
            </div>
            <span class="help-block" ng-show="$ctrl.resolve.newPrice < 1">
              Please enter a valid price (minimum ₹1)
            </span>
          </div>

          
        </div>
      </div>
    </div>
    
    <div class="modal-footer">
      <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">
        <i class="fa fa-times"></i> Cancel
      </button>
      <button type="button" 
              class="btn btn-success" 
              ng-click="$ctrl.close({$value: {success: true, updatedPrice: $ctrl.resolve.newPrice}})" 
              ng-disabled="!$ctrl.resolve.newPrice || $ctrl.resolve.newPrice < 1 || $ctrl.resolve.newPrice === $ctrl.resolve.car.basePrice">
        <i class="fa fa-check"></i> Update Price
      </button>
    </div>
  `,
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  }
});