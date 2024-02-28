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

const UserDetails = mongoose.model('userdetails', {
  licenseNumber: String,
  password: String,
});

const YouTubeUser = mongoose.model('youtubes', {
  licenseNumber: String,
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
