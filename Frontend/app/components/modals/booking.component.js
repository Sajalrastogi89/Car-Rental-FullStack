/**
 * Booking Modal Component
 *
 * Displays a scrollable list of bookings with payment status and details
 */
myApp.component("bookingDetailsModal", {
  template: `
    <div class="modal-header">
      <button type="button" class="close" ng-click="$ctrl.dismiss()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <h3 class="modal-title">
        <i class="fa fa-calendar-check-o text-primary" style="margin-right: 10px;"></i>
        Booking Details <small class="text-muted" ng-if="$ctrl.resolve.dataObject.length">{{$ctrl.resolve.dataObject.length}} bookings</small>
      </h3>
    </div>
    
    <div class="modal-body">
      <!-- Empty State -->
      <div ng-if="!$ctrl.resolve.dataObject || $ctrl.resolve.dataObject.length === 0">
       <div uib-alert class="alert-info text-center">  
        <h4>No bookings found</h4>
        <p class="text-muted">There are no bookings available for this car.</p>
        </div>
      </div>  
      
      <!-- Bookings List -->
      <div ng-if="$ctrl.resolve.dataObject && $ctrl.resolve.dataObject.length > 0" style="max-height: 400px; overflow-y: auto;">
        <div class="panel panel-default" ng-repeat="bid in $ctrl.resolve.dataObject | orderBy:'-bookingDate'" style="margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div class="panel-heading" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 class="panel-title">
              <i class="fa fa-calendar"></i> {{bid.startDate | date:'MMM dd, yyyy'}} 
              <span class="text-muted">to</span> {{bid.endDate | date:'MMM dd, yyyy'}}
            </h4>
            <span ng-class="{'label label-success': bid.paymentStatus==='paid', 'label label-warning': bid.paymentStatus==='pending'}">
              <i class="fa" ng-class="{'fa-check-circle': bid.paymentStatus, 'fa-clock-o': !bid.paymentStatus}"></i>
              {{bid.paymentStatus==='paid' ? 'Paid' : 'Payment Pending'}}
            </span>
          </div>
          <div class="panel-body">
            <div class="row">
              <!-- Customer Details -->
              <div class="col-md-4">
                <h5><i class="fa fa-user text-muted"></i> Customer</h5>
                <p style="margin-bottom: 5px;"><strong>{{bid.user.name || 'Unknown'}}</strong></p>
                </p>
                <p style="margin-bottom: 5px;" ng-if="bid.user.email">
                  <i class="fa fa-envelope text-muted"></i> {{bid.user.email}}
                </p>
              </div>
              
              <!-- Car Details -->
              <div class="col-md-4">
                <h5><i class="fa fa-car text-muted"></i> Vehicle</h5>
                <p style="margin-bottom: 5px;"><strong>{{bid.car.carName || 'Unknown'}}</strong></p>
                <p style="margin-bottom: 5px;">{{bid.car.category || ''}}</p>
              </div>
              
              <!-- Payment Details -->
              <div class="col-md-4">
                <h5><i class="fa fa-money text-muted"></i> Payment</h5>
                <h4 class="text-success" style="margin-top: 5px; margin-bottom: 10px;" ng-show="bid.totalAmount">
                  <i class="fa fa-inr"></i> {{bid.totalAmount | currency:"₹"}}
                </h4>
                <h4 class="text-danger" style="margin-top: 5px; margin-bottom: 10px;" ng-hide="bid.totalAmount">
                  <i class="fa fa-inr"></i> {{"In Progress"}}
                </h4>
                <p style="margin-bottom: 0;">
                  <span class="label" ng-class="{
                    'label-success': bid.status === 'accepted',
                    'label-danger': bid.status === 'rejected',
                    'label-warning': bid.status === 'pending',
                    'label-info': bid.status === 'completed'
                  }">{{bid.status | uppercase}}</span>
                </p>
              </div>
            </div>
            
           
          </div>
        </div>
      </div>
    </div>
  `,
  bindings: {
    resolve: "<",
    dismiss: "&",
  },
});
