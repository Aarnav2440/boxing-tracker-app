/*
Author: Aarnav Lakhanpal
Description:
Server-side code using Node.js and ExpressJS for the Boxing Class Tracker.
This server connects to MongoDB using Mongoose and provides API routes for:
1) User login (authentication)
2) User registration (creating a new user)
It returns JSON responses to the AngularJS client.
*/


//Import required modules
// Loads environment variables from .env(environment) file
const dotenv = require('dotenv');
dotenv.config(); 

const path = require('path');

// Express framework for building routes and handling HTTP requests
const express = require('express');

// Mongoose is used to define schemas/models and connect to MongoDB
const mongoose = require('mongoose');

// (Started initially using it but found out its deprecated kept for history and learnings insight
//  but not used because express.json() is used)
const bodyParser = require('body-parser');

// Allows cross-origin requests (AngularJS client -> Node server)
const cors = require('cors');

// Server port (defaults to 3000 if not set in environment)
const PORT = process.env.PORT || 3000;

// MongoDB connection URL stored in environment variables for safety
const MONGORUL = process.env.MONGODB_URL;


// Initializing the express app

// Create the Express app object
const app = express();

// Enable CORS so the client can call the API from a different origin
app.use(cors());

// Parse incoming JSON payloads (ex: login/register form data)
app.use(express.json());

// Parse URL-encoded form data (ex: from HTML forms)
app.use(express.urlencoded({ extended: true }));

// Serve the AngularJS client files (index.html, css, js, views) from /client
app.use("/client", express.static(path.join(__dirname, "client")));


//Database connection phase

// Connect to MongoDB using Mongoose
mongoose.connect(MONGORUL)
    .then(() => console.log('MongoDB successfully connected'))
    .catch(err => console.log(err));    


//From here onwards, we define the data schema and API routes

// Define what a "User" document looks like in MongoDB
// required: true ensures MongoDB validation happens before saving
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName:  { type: String, required: true },
    username:  { type: String, required: true },
    password:  { type: String, required: true },
    email:     { type: String, required: true },
    phone:     { type: String, required: true }
});

// Create a model from the schema, stored in "users" collection
const User = mongoose.model('User', userSchema, 'users');



/*
POST /api/login
Purpose:
    - Checks user credentials from the client
    - If correct, returns the full user object as JSON
Inputs:
    - username, password
Output:
    - 200 OK with user object OR error messages (401/404/500)
*/
app.post('/api/login', async (req, res) => {

    // Pull username/password from incoming request body (sent by AngularJS $http.post)
    const { username, password } = req.body;

    // Basic login validation (required fields)
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Database lookup + password match
    try {
        // Find the user by username in MongoDB
        const user = await User.findOne({ username: username });

        // If user does not exist, return 404
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Plain text password compare (A3 requirement / no hashing needed)
        if (user.password === password) {
            // Return user object to client so profile page can display details
            return res.json(user);
        } else {
            // If password mismatches, return 401
            return res.status(401).json({ message: "Invalid credentials" });
        }

    } catch (err) {
        // If MongoDB or server crashes
        return res.status(500).json({ message: "Server error" });
    }
});


/*
POST /api/register
Purpose:
    - Creates a new user in MongoDB from the registration form
    - Prevents duplicate usernames
Inputs:
    - username, password, firstName, lastName, email, phone
Output:
    - 201 Created with new user object OR error messages (400/500)
*/
app.post('/api/register', async (req, res) => {

    // Pull registration fields from request body
    const { 
        username, 
        password, 
        firstName,
        lastName, 
        email, 
        phone 
    } = req.body;

// Input validation for each fields using length and regex predefined.

    // First name: letters only
    const fnameRegex = /^[a-zA-Z]+$/;

    // Last name: letters, allows hyphen/apostrophe
    const lnameRegex = /^[a-zA-Z]+(['-][a-zA-Z]+)*$/;

    // Email format check
    const emailRegex = /^[\w-\.]+@([\w-]+\.)[\w]{2,6}$/;

    // Phone number: must be exactly 10 digits
    const phoneNumberRegex = /^[0-9]{10}$/;


    // 1. First name required + format
    if (!firstName) {
        return res.status(400).json({ message: "First name is required" });
    }
    if (!fnameRegex.test(firstName)) {
        return res.status(400).json({ message: "First Name should contain only letters" });
    }

    // 2. Last name required + format
    if (!lastName) {
        return res.status(400).json({ message: "Last Name is required" });
    }
    if (!lnameRegex.test(lastName)) {
        return res.status(400).json({ message: "Last Name should contain only letters" });
    }

    // 3. Email required + format
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Email format is invalid" });
    }

    // 4. Phone required + digits + length
    if (!phone) {
        return res.status(400).json({ message: "Phone Number is required" });
    }
    if (!phoneNumberRegex.test(phone)) {
        return res.status(400).json({ message: "Phone Number must be 10 digits" });
    }

    // 5. Username/password required checks (basic)
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

//Database operations phase

    try {
        // 1. Check if username already exists (avoid duplicates)
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // 2. Build a user object matching the schema
        const newUser = new User({
            firstName: firstName,
            lastName: lastName,
            username: username,
            password: password, 
            email: email,
            phone: phone
        });

        // 3. Save it into MongoDB
        await newUser.save();

        // testing 
        // console.log(`New user registered: ${username}`);

        // Return the created user object back to the Angular client
        return res.status(201).json(newUser);

    } catch (err) {
        // Handles errors like DB connection issues or save failures
        console.error(err);
        return res.status(500).json({ message: "Error saving user to database" });
    }
});


//Starting the server

// Start listening on the chosen port
app.listen(PORT, () => {
    console.log(`server live on port: ${PORT}`);
});
