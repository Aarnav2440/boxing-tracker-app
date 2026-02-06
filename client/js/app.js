/*Author: Aarnav Lakhanpal

Description:
AngularJS client-side/frontend logic for the Boxing Class Tracker website.
This file defines the SPA routes (ngRoute) and controllers that:
1) Display public pages/views (Home, Schedule)
2) Handle login/registration by sending data to the Node.js server (ExpressJS)
3) Display the logged-in user's profile details retrieved from MongoDB
*/

//Create AngularJS module with routing
var app = angular.module("boxingApp", ["ngRoute"]);

/* Using Angular 1.8.2 
Route Configuration:
    - Uses hashbang URLs (#!) for single-page application navigation
    - Each route loads a specific HTML template inside <div ng-view> (an HTML injection point).
    - Some routes also attach controllers to control the page logic
*/
app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("!");

    $routeProvider
    .when("/", {
        templateUrl: "views/homePage.html"
    })
    .when("/schedule", {
        templateUrl: "views/schedule.html",
        controller: "ScheduleController"
    })
    .when("/login", {
        templateUrl: "views/login.html",
        controller: "AuthController"
    })
    .when("/profile", {
        templateUrl: "views/profile.html",
        controller: "ProfileController"
    })
    .otherwise({
        redirectTo: "/"
    });
});


/*
  MainController:
    Controls navigation visibility and logout logic.
    - Tracks across all views whether the user is logged in or not.
    - Restricts profile page access unless logged in or registered as a new user.
    - Maintains logging out logic by using in memory storage of user data.
*/
app.controller("MainController", function ($scope, $rootScope, $location) {
  // Store logged-in user (null means logged out)
    $rootScope.currentUser = $rootScope.currentUser || null;

    $scope.isLoggedIn = function () {
        return $rootScope.currentUser !== null;
    };

    $scope.checkProfileAccess = function() {
        if ($scope.isLoggedIn()) {
            $location.path("/profile");
        } else {
            alert("You are not logged in! Please login to view your profile.");
            $location.path("/login");
        }
    };

    $scope.logout = function () {
        $rootScope.currentUser = null;
        $location.path("/");
    };
});

/*
  ScheduleController (PUBLIC FEATURE)
    Displays the publicly accessible schedule table view of all the boxing classes for the week.
    Stored as a static array, displayed to the client using the ng-repeat directive.
*/
app.controller("ScheduleController", function ($scope) {
    $scope.classes = [
        { day: "Monday",    time: "6:00 PM",  type: "Fundamentals",     level: "Beginner" },
        { day: "Tuesday",   time: "7:00 AM",  type: "60-Blast",         level: "All Levels" },
        { day: "Wednesday", time: "7:00 PM",  type: "Boxing 201",       level: "Intermediate" },
        { day: "Thursday",  time: "5:45 PM",  type: "Fast-45",          level: "All Levels" },
        { day: "Friday",    time: "5:30 PM",  type: "Sparring Skills",  level: "Advanced" },
        { day: "Saturday",  time: "10:00 AM", type: "Youth-Box",        level: "Youth" },
        { day: "Saturday",  time: "11:30 AM", type: "Women-Only",       level: "All Levels" },
        { day: "Sunday",    time: "12:00 PM", type: "Combo-bagwork",    level: "All Levels" }
];
});

/*
  AuthController: Handles login and registration with Node backend.
    - Login: sends username and password to the server side, which further authenticates and sends a response back.
    - Registration: sends new user details to the server side, which stores them in MongoDB and sends back a response, while also logging them in automatically.
    - Error handling is done when username or password is incorrect, or when required fields are missing for login/register.
*/
app.controller("AuthController", function ($scope, $rootScope, $location, $http) {
    
    $scope.showLogin = null;
    $scope.loginUser = {};
    $scope.newUser = {};
    $scope.errorMessage = "";

    if ($rootScope.logoutFlag) {
        $scope.errorMessage = "Session expired. Please login again.";
        $rootScope.logoutFlag = false;
    }

    if ($rootScope.logoutFlag) {
        $scope.errorMessage = "You have been logged out successfully.";
        
        // Clean up: reset the flag so it doesn't show again on next visit
        $rootScope.logoutFlag = false; 
    }

    if ($rootScope.currentUser) {
        alert("You are already logged in as " + $rootScope.currentUser.username + ". You can login as a different user below.");
    }

    $scope.$watch('showLogin', () =>{
        $scope.errorMessage = "";
    });

    // REAL LOGIN LOGIC
    $scope.login = function () {
        if (!$scope.loginUser.username || !$scope.loginUser.password) {
            $scope.errorMessage = "Please enter username and password.";
            return;
        }

        // Send credentials to our Express server
        $http.post('http://localhost:3000/api/login', {
            username: $scope.loginUser.username,
            password: $scope.loginUser.password
        })
        .then(function(response) {
            // response.data contains the user fields from MongoDB
            $rootScope.currentUser = response.data;
            $location.path("/profile");
        })
        .catch(function(error) {
            // Handle 401 (Wrong password) or 404 (User missing)
            $scope.errorMessage = error.data.message || "Login failed try again.";
        });
    };

    $scope.register = function () {
        // 2. Updated check to match your new full HTML ng-model names
        if (
            !$scope.newUser.username ||
            !$scope.newUser.password ||
            !$scope.newUser.firstName || 
            !$scope.newUser.lastName ||
            !$scope.newUser.email ||
            !$scope.newUser.phone
        ) {
            $scope.errorMessage = "Please fill in all fields.";
            return;
        }

      // --- REAL REGISTRATION $HTTP CALL ---
        $http.post('http://localhost:3000/api/register', $scope.newUser)
            .then(function(response) {
                console.log("Registration Successful!");
                
                // Automatically log them in after registration
                $rootScope.currentUser = response.data;
                $location.path("/profile");
            })
            .catch(function(error) {
                console.error("Registration Error:", error);
                $scope.errorMessage = error.data.message || "Registration failed.";
            });
    };
});

/*
  ProfileController:
  Displays the logged-in user's profile.
  Also updates the status of an active member, just a small detail to give more motivation to the fighters registering in our camp.
  Business logic only; not a functional feature.
*/
app.controller("ProfileController", function ($scope, $rootScope, $location) {
    if(!$rootScope.currentUser){
        $rootScope.logoutFlag = true;
        $location.path("/login");
        return;
    }
    
    $rootScope.currentUser.status = "Active Member"
    $scope.profile = $rootScope.currentUser;
});