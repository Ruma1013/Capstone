const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');


const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect('mongodb+srv://shankavisal:shankavisal@cluster0.mvsfcc1.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));
const finesDb = mongoose.connection.useDb('MiniProject'); // For Fine model

const UserDetails = mongoose.model('userdetails', {
  licenseNumber: String,
  password: String,
});

const YouTubeUser = mongoose.model('youtubes', {
  firstName: String,
  lastName: String,
  DOB: String,
  DOI: String,
  DOE: String,
  IDnum: String,
  address: String,
  vehicleCategory: [String],
  licenseNumber: String,
  url: String,
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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

// Route for registration
app.post('/api/register', async (req, res) => {
  const { licenseNumber, password } = req.body;

  try {
    // Check if the user with the given license number exists in the "test.youtubes" collection
    const youtubeUser = await YouTubeUser.findOne({ licenseNumber });

    if (!youtubeUser) {
      return res.status(400).json({ error: 'License number not found. You cannot register until you are authenticated.' });
    }

    // Check if the user with the given license number already exists in the "test.userdetails" collection
    const existingUser = await UserDetails.findOne({ licenseNumber });

    if (existingUser) {
      return res.status(400).json({ error: 'User already registered. You cannot register again.' });
    }

    // Hash the password before saving to the "test.userdetails" collection
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserDetails({
      licenseNumber,
      password: hashedPassword,
    });

    // Save the new user to the "test.userdetails" collection
    await newUser.save();

    res.status(200).json({ success: true, message: 'Registration successful! Please log in.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: `An error occurred during registration. Details: ${error.message}` });
  }
});

// Route for login
app.post('/api/login', async (req, res) => {
  const { licenseNumber, password } = req.body;

  try {
    const user = await UserDetails.findOne({ licenseNumber });

    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
        res.status(200).json({ success: true, message: 'Login successful!' });
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

// Route for authentication and fetching URL
app.post('/qr/authenticate', async (req, res) => {
  const { licenseNumber } = req.body;

  try {
    // Check if the user with the given license number exists in the "youtubes" collection
    const youtubeUser = await YouTubeUser.findOne({ licenseNumber });

    if (!youtubeUser) {
      return res.status(400).json({ error: 'License number not found. You cannot proceed until you are authenticated.' });
    }

    // If the user exists, send the URL to the frontend
    res.status(200).json({ success: true, url: youtubeUser.url });
  } catch (error) {
    console.error('Error during authentication and URL fetching:', error);
    res.status(500).json({ error: `An error occurred during authentication and URL fetching. Details: ${error.message}` });
  }
});

// Admin authentication route
app.post('/admin/authenticate', (req, res) => {
  const { jobId, password } = req.body;

  // Hardcoded admin credentials
  const adminCredentials = {
      jobId: 'admin123', // Change this to your admin's job ID
      password: 'admin@Password' // Change this to your admin's password
  };

  // Check if entered credentials match the hardcoded admin credentials
  if (jobId === adminCredentials.jobId && password === adminCredentials.password) {
      // Authentication successful
      res.status(200).json({ message: 'Authentication successful' });
  } else {
      // Authentication failed
      res.status(401).json({ message: 'Invalid credentials' });
  }
});


// Route for fetching user details
app.get('/api/users', async (req, res) => {
  try {
    const users = await YouTubeUser.find();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Route for adding a new user
app.post('/api/users', async (req, res) => {
  try {
    const newUser = new YouTubeUser(req.body);
    await newUser.save();
    res.status(201).json({ message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Route for editing a user
app.put('/api/users/:licenseNumber', async (req, res) => {
  const { licenseNumber } = req.params;
  try {
    await YouTubeUser.findOneAndUpdate({ licenseNumber }, req.body);
    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Route for deleting a user
app.delete('/api/users/:licenseNumber', async (req, res) => {
  const { licenseNumber } = req.params;
  try {
    await YouTubeUser.findOneAndDelete({ licenseNumber });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Route to get count of users in test.youtubes collection
app.get('/api/youtube-users/count', async (req, res) => {
  try {
    const count = await YouTubeUser.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching count of YouTube users:', error);
    res.status(500).json({ error: 'Failed to fetch count of YouTube users' });
  }
});

// Route to get count of registered users in test.userdetails collection
app.get('/api/registered-users/count', async (req, res) => {
  try {
    const count = await UserDetails.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching count of registered users:', error);
    res.status(500).json({ error: 'Failed to fetch count of registered users' });
  }
});

// Route to fetch user details by license number
app.get('/api/users/:licenseNumber', async (req, res) => {
  const licenseNumber = req.params.licenseNumber;

  try {
    const user = await YouTubeUser.findOne({ licenseNumber });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user details by license number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
