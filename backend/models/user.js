const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  licenceNumber: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
