//config/database.js
//Database connection
const mongoose = require('mongoose');

const dbConnection = () => {
  const dbUri = 'mongodb://127.0.0.1:27017/Printing';
  mongoose
    .connect(dbUri)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('Error connecting to MongoDB:', err);
      process.exit(1);
    });
};

module.exports = dbConnection;
