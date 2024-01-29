const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect('mongodb+srv://mohamedfasal6543:<Fas@456110>@cluster0.nwzn3fl.mongodb.net/?retryWrites=true&w=majority', {});
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.once('open', () => console.log('Connected to MongoDB'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (CSS, JS, etc.)
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

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
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
