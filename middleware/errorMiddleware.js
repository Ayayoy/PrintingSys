// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === 'ValidationError') {
    status = 400;
    message = Array.isArray(err.errors) ? err.errors.map(error => error.msg).join(', ') : err.message;
  } else if (err.name === 'MongoError') {
    status = 500;
    message = "Database Error: An error occurred while accessing the database.";
  }

  res.status(status).json({
    message: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '🥞',
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({ message: 'Route not found.' });
};

module.exports = { errorHandler, notFoundHandler };

