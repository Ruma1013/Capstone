const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt'); // Add bcrypt for password hashing

const app = express();
const PORT = process.env.PORT || 3001;

mongoose.connect('mongodb+srv://shankavisal:shankavisal@cluster0.mvsfcc1.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

// Assuming you have a model for storing user details with additional fields
const UserDetails = mongoose.model('userDetails', {
  licenseNumber: String,
  name: String,  // Add other fields as needed
  // Add other fields as needed
  password: String,
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

app.post('/api/register', async (req, res) => {
  const { licenseNumber, name, password } = req.body;

  try {
    // Check if the user with the same license number already exists
    const existingUser = await UserDetails.findOne({ licenseNumber });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this license number already exists.' });
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newYouTubeUser = new UserDetails({
      licenseNumber,
      name,
      password: hashedPassword,
    });

    // Save the new user to the database
    await newYouTubeUser.save();

    res.status(200).json({ success: true, message: 'Registration successful! Please log in.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: `An error occurred during registration. Details: ${error.message}` });
  }
});

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
