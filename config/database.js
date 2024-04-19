//config/database.js
//Database connection
const mongoose = require('mongoose');

const dbConnection = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then(() => {})
    .catch((err) => {
      process.exit(1);
    });
};

module.exports = dbConnection;
