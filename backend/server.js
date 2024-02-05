const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect('mongodb+srv://shankavisal:shankavisal@cluster0.mvsfcc1.mongodb.net/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

// Define a User model for the "youtube" collection
const YouTubeUser = mongoose.model('youtube', {
  fullName: String,
  licenceNumber: String,
  password: String,
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS, etc.) from the frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.post('/register', (req, res) => {
  const { fullName, licenceNumber, password } = req.body;

  // Create a new user instance for the "youtube" collection
  const newYouTubeUser = new YouTubeUser({
    fullName,
    licenceNumber,
    password,
  });

  // Save the user to the "youtube" collection in MongoDB
  newYouTubeUser.save((err) => {
    if (err) {
      console.error('Error saving YouTube user:', err);
      return res.status(500).send('Internal Server Error');
    }

    res.status(200).send('Registration successful! Please log in.');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
