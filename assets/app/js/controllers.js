'use strict';

/* 
 * Controllers
*/

// Authentication controller
function AuthenticationCtrl($scope, $http, $log, $cookieStore, SecurityServices, Context, Notif) {

    // AuthenticationBySerialSubmit button
    $scope.authenticationBySerialSubmit = function() {

        if ($scope.account && $scope.account.inputSerial && $scope.account.inputKey) {
            // checkCRC service
            SecurityServices.checkCRC($scope.account.inputSerial, $scope.account.inputKey)
                .success(function(data, status) {
                    $log.info('checkCRC OK : data = ' + data);
                    $cookieStore.put('dtoken', data);
                    Context.setSerial($scope.account.inputSerial);
                    Context.setDashBoardVisibilty(true);
                })
                .error(function(data, status) {
                    $log.error('checkCRC KO : Failed request status = ' + status + ' & data = ' + data);
                    $cookieStore.remove('dtoken');
                    $cookieStore.remove('utoken');
					Context.setSerial(undefined);
                    Context.setDashBoardVisibilty(false);
					Notif.error(data);
                });
        }
    };

    // AuthenticationByEmailSubmit button
    $scope.authenticationByEmailSubmit = function() {
		Notifs.info("Coming up soon");
    };

}


// Registration controller
function RegistrationCtrl($scope, $http, $log, $cookieStore, CONSTANTS, SecurityServices, Notif) {

    // Registration button
    $scope.registrationSubmit = function() {
        var hosturl = CONSTANTS.remote;

        // registration service
        SecurityServices.registration($scope.account)
            .success(function(data, status) {
                $cookieStore.put('utoken', data);
                $log.info('Registration OK : utoken = ' + data);
				Notif.success('A confirmation email has been sent to the registered email adress, checkout your mbox');
            }).error(function(data, status) {
                $cookieStore.remove('utoken');
                $log.error('Registration KO : Failed request status = ' + status + ' & data = ' + data);
				Notif.error(data);
            });
    };

    // Delete button
    $scope.deleteClick = function() {
        if ($scope.account && $scope.account.email) {
            var utoken = $cookieStore.get('utoken');
            if (utoken) {
                // delete account service
                SecurityServices.deleteAccount($scope.account.email)
                    .success(function(data, status) {
                        $log.info('Delete OK : data = ' + data);
                    }).error(function(data, status) {
                        $log.error('Delete KO : Failed request status = ' + status + ' & data = ' + data);
                    });
            } else {
				Notif.error('User token missing, please check parameters');
                $log.error('UToken is missing');
            }
        } else {
			Notif.error('User email is required, please check parameters');
            $log.error('Email is required');
        }
    };
}


// Dashboard controller
function DashboardCtrl($log, $scope, DevicesServices, $timeout, $cookieStore, Context, Notif) {

    $scope.messages = [];
    $scope.lastUpdate = new Date().getTime();
	$scope.timer = undefined;
	$scope.serial = undefined;

    // loadMore    
    $scope.loadMore = function() {
        var oldest = $scope.messages.length != 0 ? $scope.messages[$scope.messages.length - 1].when : null;

        DevicesServices.getMessagesBefore(Context.serial, oldest, 50)
            .then(function(response){
                $log.info("within resolved resources", response.data);
                angular.forEach(response.data, function(value, key){
                    $scope.messages.push(value);
                });
                $scope.lastUpdate = new Date().getTime();
            });
    }

    // checkForNewMsg
    $scope.checkForNewMsg = function() {
        var newest = $scope.messages.length != 0 ? $scope.messages[0].when : null;

        DevicesServices.getMessagesAfter(Context.serial, newest, 50)
            .then(function(response){
                angular.forEach(response.data.reverse(), function(item, value){
                    jQuery.pnotify({
                        title: ''+new Date(item.when),
                        text: item.hr,
                        hide: false,
						type: 'info',
                        styling: 'bootstrap'
                    });
                    $scope.messages.splice(0, 0, item);
                });
                $scope.lastUpdate = new Date().getTime();
            });
    }

    $scope.poll = function() {
        $scope.checkForNewMsg();
       	$scope.timer = $timeout($scope.poll, 5000);
    }

    // Event handleDisplayDashboard
    $scope.$on('DashBoardEvent', function() {
		$log.info('waking up on dashoard event');
        $scope.displayDashboard = Context.dashboard.visible;
		if (true == $scope.displayDashboard) {
        	$scope.loadMore();	
			if (undefined == $scope.timer) {
				$log.info("calling polling operation");
				$scope.poll();
			} else {
				$log.info("not calling polling operation");
			}
		} else {
			clearInterval($scope.timer);
		}
    });

    // Event handleDisplayDashboard
    $scope.$on('newSerialEvent', function() {
        $scope.serial = Context.serial;
    });
}

function LogOutCtrl($scope, $log, $cookieStore, Context, Notif) {
	
	$scope.display = false;
	$scope.serial = undefined;
	
	$scope.logOut = function() {
		$cookieStore.remove('dtoken');
		$cookieStore.remove('utoken');
		Context.setSerial(undefined);
        Context.setDashBoardVisibilty(false);
		Notif.info('See you Soon');
	}
	
	// Event handleDisplayDashboard
    $scope.$on('DashBoardEvent', function() {
		$log.info('waking up on dashoard event');
        $scope.display = Context.dashboard.visible;
        $scope.serial = Context.serial;
    });
	
	
}