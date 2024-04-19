//models/user.js
const mongoose = require("mongoose");
const { hashPassword } = require("./dbMethods/userMethods");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required."],
    minlength: [4, "Username must be at least 4 characters long."],
    maxlength: [20, "Username cannot exceed 20 characters."]
  },
  password: {
    type: String,
    index: true,
    required: [true, "Password is required."],
    minlength: [6, "Password must be at least 6 characters long."]
  },
  email: {
    type: String,
    index: true,
    required: [true, "Email is required."],
    unique: true,
    validate: {
      validator: function (value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: "Please enter a valid email address."
    }
  },
  phoneNumber: {
    type: String,
    required: [true, "Phone number is required."],
    match: [/^((\+|00)20|0)?1[0-2,5]\d{8}$/, "Please enter a valid phone number."]
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
},
{
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
