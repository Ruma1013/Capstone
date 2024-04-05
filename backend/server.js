const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
<<<<<<< Updated upstream

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect('mongodb+srv://admin:admin@cluster0.nwzn3fl.mongodb.net/?retryWrites=true&w=majority', {});
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

// Middleware
=======
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3001;

// Establish connection to MongoDB Atlas
mongoose.connect('mongodb+srv://shankavisal:shankavisal@cluster0.mvsfcc1.mongodb.net', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((error) => console.error('MongoDB connection error:', error));

// Use the specified databases for each model
const userDetailsDb = mongoose.connection.useDb('test'); // For UserDetails model
const youTubeUserDb = mongoose.connection.useDb('test'); // For YouTubeUser model
const finesDb = mongoose.connection.useDb('MiniProject'); // For Fine model

// Define models for each database
const UserDetails = userDetailsDb.model('userdetails', {
  licenseNumber: String,
  password: String,
});

const YouTubeUser = youTubeUserDb.model('youtubes', {
  licenseNumber: String,
  firstName: String,
  lastName: String,
  DOB: String,
  address: String,
  DOI: String,
  DOE: String,
  IDnum: String,
  vehicleCategory: String,
});

const FineSchema = new mongoose.Schema({
  driverFirstName: String,
  driverLastName: String,
  driverLicenseNumber: String,
  driverID: String,
  vehicleNumber: String,
  totalFine: Number,
  date: Date,
  fines: [{
    name: String,
    amount: Number
  }]
},{ collection: 'User Fines' });

const Fine = finesDb.model('User Fines', FineSchema);

>>>>>>> Stashed changes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS, etc.)
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

<<<<<<< Updated upstream
app.post('/register', (req, res) => {
  const { fullName, licenceNumber, password } = req.body;

  // Here you would perform actual registration logic and save to MongoDB
  // For simplicity, let's assume you have a User model

  const User = mongoose.model('User', {
    fullName: String,
    licenceNumber: String,
    password: String,
  });

  const newUser = new User({ fullName, licenceNumber, password });

  newUser.save((err) => {
    if (err) {
      console.error('Error saving user:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.status(200).send('Registration successful! Please log in.');
  });
});

// Start the server
=======
// Route for login
app.post('/api/login', async (req, res) => {
  const { licenseNumber, password } = req.body;

  try {
    // Check if the license number exists in the "youtubes" collection
    const youtubeUser = await YouTubeUser.findOne({ licenseNumber });

    if (!youtubeUser) {
      return res.status(401).json({ success: false, error: 'License number not found. Please check your license number.' });
    }

    // If license number found, proceed with login
    const user = await UserDetails.findOne({ licenseNumber });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        // If password matches, send user details along with login success message
        res.status(200).json({
          success: true,
          message: 'Login successful!',
          userDetails: {
            name: `${youtubeUser.firstName} ${youtubeUser.lastName}`,
            address: youtubeUser.address,
            dob: youtubeUser.DOB,
            doi: youtubeUser.DOI,
            doe: youtubeUser.DOE,
            ID: youtubeUser.IDnum,
            VC: youtubeUser.vehicleCategory,
            lC: youtubeUser.licenseNumber,
            LC: licenseNumber,
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid password. Please try again.' });
      }
    } else {
      res.status(401).json({ success: false, error: 'User not found. Please check your license number.' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'An error occurred during login. Please try again later.' });
  }
});

// Route to fetch all outstanding fines for a user
app.post('/api/outstandingFines', async (req, res) => {
  const { licenseNumber } = req.body;

  try {
    console.log('Received request to fetch outstanding fines for license number:', licenseNumber);

    // Check if the license number matches with driverLicenseNumber in Fine model
    const finesUser = await Fine.findOne({ driverLicenseNumber: licenseNumber });

    if (!finesUser) {
      return res.status(404).json({ success: false, error: 'No outstanding fines found for the provided license number.' });
    }

    // If license number matches, retrieve fines details
    const fines = finesUser.fines.map(fine => ({
      date: fine.date,
      driverID: finesUser.driverID,
      name: fine.name,
      amount: fine.amount,
      fullamount: finesUser.totalFine
    }));

    // Send back fines details in the response
    res.status(200).json({ success: true, fines });

  } catch (error) {
    console.error('Error retrieving outstanding fines:', error);
    res.status(500).json({ success: false, error: 'An error occurred while retrieving outstanding fines.' });
  }
});

// Route to handle payment processing
app.post('/api/payFines', async (req, res) => {
  // Handle payment processing here
  // You can retrieve payment details from req.body and update the database accordingly
  // For demonstration purposes, let's just send back a success message
  
  res.status(200).json({ success: true, message: 'Payment processed successfully.' });
});

>>>>>>> Stashed changes
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
