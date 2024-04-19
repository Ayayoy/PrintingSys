// controllers/authController.js
const UserModel = require("../models/user");
const { comparePassword } = require("../models/dbMethods/userMethods");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email");
const { generateToken, generateRandomToken } = require("../utils/token");
const jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const { username, password, email, phoneNumber } = req.body;

    const verificationToken = generateRandomToken();

    const newUser = await UserModel.create({
      username,
      password,
      email,
      phoneNumber,
      verificationToken,
    });

    if (!newUser) {
      throw new Error("Failed to register user.");
    }
    const emailPromise = sendVerificationEmail(email, verificationToken);

    await Promise.all([newUser, emailPromise]);

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for verification.",
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await UserModel.findOne({ verificationToken: token });

    if (user.verificationToken !== token) {
      return res.status(400).json({ message: "Invalid verification token." });
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verification successful." });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.emailVerified) {
      return res.status(401).json({
        message:
          "Email not verified. Please check your email for verification.",
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = generateToken(user);

    delete user._doc.password;

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {

    res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate a verification token for resetting password
    const resetToken = generateRandomToken();
    user.verificationToken = resetToken;

    await user.save();

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, resetToken);

    if (!emailSent) {
      throw new Error("Failed to send password reset email.");
    }

    res.status(200).json({
      message: "Password reset email sent. Please check your email.",
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await UserModel.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid or expired token." });
    }

    user.password = newPassword;

    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    next(error);
  }
};

const protected = async (req, res, next) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: "No token provided." });
    }

    const tokenParts = token.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format." });
    }

    const jwtToken = tokenParts[1];

    const decodedToken = jwt.verify(jwtToken, process.env.JWT_SECRET);

    const userId = decodedToken.userId;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User associated with token does not exist." });
    }

    req.user = user;

    res.status(200).json({ message: "user is authinticated." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  protected,
};
