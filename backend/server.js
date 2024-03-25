const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3001;

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
  licenseNumber: String,
  url: String,
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

    // Twilio configuration
const accountSid = 'your_account_sid';
const authToken = 'your_auth_token';
const client = twilio(accountSid, authToken);

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

// Endpoint to check license number and send OTP
app.post('/api/forgot-password-check', async (req, res) => {
  const { licenseNumber } = req.body;

  try {
    // Check if the user with the given license number exists
    const user = await UserDetails.findOne({ licenseNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: 'License number not found.' });
    }

    // Generate OTP (you may implement your own OTP generation logic)
    const otp = Math.floor(1000 + Math.random() * 9000);

    // Send OTP to the user's phone number
    client.messages
      .create({
        body: `Your OTP for password reset: ${otp}`,
        from: 'your_twilio_phone_number',
        to: user.phoneNumber
      })
      .then(() => {
        res.status(200).json({ success: true, message: 'OTP sent successfully.', otp });
      })
      .catch(err => {
        console.error('Error sending OTP:', err);
        res.status(500).json({ success: false, message: 'Failed to send OTP.' });
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Endpoint to verify OTP and update password
app.post('/api/verify-otp', async (req, res) => {
  const { licenseNumber, phoneNumber, otp } = req.body;

  try {
    // Verify OTP (you need to implement this logic)
    // Once OTP is verified, update the password
    // Send appropriate response back to the client
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
