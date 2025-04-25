/**
 * Bidding Modal Component
 *
 * Displays a scrollable list of bids with accept/reject actions
 */
myApp.component("bestBidsModal", {
  template: `
    <div class="modal-header">
      <button type="button" class="close" ng-click="$ctrl.dismiss()" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
      <h3 class="modal-title d-flex justify-content-between align-items-center">
        <div>
          <i class="fa fa-calendar-check-o text-primary" style="margin-right: 10px;"></i>
          Best Bids <small class="text-muted" ng-if="$ctrl.resolve.dataObject.length">{{$ctrl.resolve.dataObject.length}} bids</small>
        </div>
        <div class="text-success" ng-if="$ctrl.resolve.maxProfit">
          <small>Max Profit:</small> ₹{{$ctrl.resolve.maxProfit}}<br>
        </div>
      </h3>
      <small>(Accept these bids of next 15 days to get maximum profit)</small>
    </div>
    
    <div class="modal-body">
      <!-- Empty State -->
      <div ng-if="!$ctrl.resolve.dataObject || $ctrl.resolve.dataObject.length === 0">
       <div uib-alert class="alert-info text-center">  
        <h4>No bids found</h4>
        <p class="text-muted">There are no bids available for this car.</p>
        </div>
      </div>  
      
      <!-- Bids List -->
      <div ng-if="$ctrl.resolve.dataObject && $ctrl.resolve.dataObject.length > 0" style="max-height: 400px; overflow-y: auto;">
        <div class="panel panel-default" ng-repeat="bid in $ctrl.resolve.dataObject | orderBy:'startDate'" style="margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div class="panel-heading" ng-class="{
            'panel-success': bid.status === 'accepted',
            'panel-warning': bid.status === 'pending',
            'panel-danger': bid.status === 'rejected'
          }" style="display: flex; justify-content: space-between; align-items-center;">
            <h4 class="panel-title">
              <i class="fa fa-calendar"></i> {{bid.startDate | date:'MMM dd, yyyy'}} 
              <span class="text-muted">to</span> {{bid.endDate | date:'MMM dd, yyyy'}}
            </h4>
            <div>
              <span class="label" style="margin-right: 5px;" ng-class="{
                'label-primary': bid.tripType === 'inCity',
                'label-info': bid.tripType === 'outStation'
              }">
                <i class="fa" ng-class="{
                  'fa-building': bid.tripType === 'inCity',
                  'fa-road': bid.tripType === 'outStation'
                }"></i> {{bid.tripType}}
              </span>
              <span class="label" ng-class="{
                'label-warning': bid.status === 'pending',
                'label-success': bid.status === 'accepted',
                'label-danger': bid.status === 'rejected'
              }">
                <i class="fa" ng-class="{'fa-check-circle': bid.status, 'fa-clock-o': !bid.status}"></i>
                {{ bid.status | uppercase }}
              </span>
            </div>
          </div>
          <div class="panel-body">
            <div class="row">
              <!-- Customer Details -->
              <div class="col-md-4">
                <h5><i class="fa fa-user text-muted"></i> Customer</h5>
                <p style="margin-bottom: 5px;"><strong>{{bid.user.name || 'Unknown'}}</strong></p>
                <p style="margin-bottom: 5px;" ng-if="bid.user.email">
                  <i class="fa fa-envelope text-muted"></i> {{bid.user.email}}
                </p>
                <p style="margin-bottom: 5px;" ng-if="bid.user.phone">
                  <i class="fa fa-phone text-muted"></i> {{bid.user.phone}}
                </p>
              </div>
              
              <!-- Car Details -->
              <div class="col-md-4">
                <h5><i class="fa fa-car text-muted"></i> Vehicle</h5>
                <p style="margin-bottom: 5px;"><strong>{{bid.car.carName || 'Unknown'}}</strong></p>
                <p style="margin-bottom: 5px;">{{bid.car.category || ''}}</p>
                <p style="margin-bottom: 5px;">{{bid.car.numberPlate || ''}}</p>
              </div>
              
              <!-- Bid Actions -->
              <div class="col-md-4">
                <h5><i class="fa fa-gavel text-muted"></i> Bid Amount</h5>
                <h4 class="text-primary" style="margin-top: 5px; margin-bottom: 15px;">
                  ₹{{bid.bidAmount}}
                </h4>

                <!-- Action Buttons for Pending Bids -->
                <div ng-if="bid.status === 'pending'" class="btn-group btn-group-justified">
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-danger" ng-click="$ctrl.rejectBid(bid)" ng-disabled="$ctrl.loading">
                      <i class="fa fa-times"></i> Reject
                    </button>
                  </div>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-success" ng-click="$ctrl.acceptBid(bid)" ng-disabled="$ctrl.loading">
                      <i class="fa fa-check"></i> Accept
                    </button>
                  </div>
                </div>

                <!-- Status Message for Non-pending Bids -->
                <div class="alert" 
                     ng-if="bid.status !== 'pending'"
                     ng-class="{
                       'alert-success': bid.status === 'accepted',
                       'alert-danger': bid.status === 'rejected'
                     }"
                     style="padding: 8px; margin-bottom: 0; font-size: 12px;">
                  <p class="text-center" style="margin: 0;">
                    <i class="fa" ng-class="{
                      'fa-check-circle': bid.status === 'accepted',
                      'fa-times-circle': bid.status === 'rejected'
                    }"></i>
                    <strong>{{ bid.status }}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  bindings: {
    resolve: "<",
    dismiss: "&"
  },
  controller: ["BiddingService", "ToastService", function(BiddingService, ToastService) {
    let ctrl = this;
    ctrl.loading = false;

    ctrl.acceptBid = function(bid) {
      ctrl.loading = true;
      BiddingService.acceptBid(bid._id)
        .then(function(response) {
          console.log("response",response);
          bid.status = 'accepted';
        })
        .catch(function(error) {
          ToastService.error(error.message || 'Failed to accept bid');
        })
        .finally(function() {
          ctrl.loading = false;
        });
    };

    ctrl.rejectBid = function(bid) {
      ctrl.loading = true;
      BiddingService.rejectBid(bid._id)
        .then(function(response) {
          console.log("response",response);
          bid.status = 'rejected';
        })
        .catch(function(error) {
          ToastService.error(error.message || 'Failed to reject bid');
        })
        .finally(function() {
          ctrl.loading = false;
        });
    };
  }]
});
