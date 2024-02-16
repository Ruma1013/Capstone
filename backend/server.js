const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3001;

// Set up session middleware
app.use(session({
  secret: 'your-secret-key', // Add a secret key for session
  resave: false,
  saveUninitialized: true
}));

mongoose.connect('mongodb+srv://shankavisal:shankavisal@cluster0.mvsfcc1.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

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
  vehicleCategory: String,
  licenseNumber: String
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

// Route for registration
app.post('/api/register', async (req, res) => {
  const { licenseNumber, password } = req.body;

  try {
    // Check if the user with the same license number exists in the "youtubes" collection
    const existingUser = await YouTubeUser.findOne({ licenseNumber });

    if (!existingUser) {
      return res.status(400).json({ error: 'License number not found. Please check your license number.' });
    }

    // Hash the password before saving to the "userdetails" collection
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserDetails({
      licenseNumber,
      password: hashedPassword,
    });

    // Save the new user to the "userdetails" collection
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
        // Store licenseNumber in session storage
        req.session.licenseNumber = licenseNumber;
        console.log('License number stored in session:', req.session.licenseNumber);

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

// Route for generating QR code
app.get('/api/qr/:licenseNumber', async (req, res) => {
  const { licenseNumber } = req.params;

  try {
    // Find user details by license number
    const user = await YouTubeUser.findOne({ licenseNumber });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate QR code with user details
    const qrCodeData = `Name: ${user.firstName} ${user.lastName}, DOB: ${user.DOB}, ID: ${user.IDnum}`;
    QRCode.toDataURL(qrCodeData, (err, url) => {
      if (err) {
        return res.status(500).json({ message: 'Error generating QR code' });
      }
      res.json({ qrCodeUrl: url });
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
