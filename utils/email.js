const nodemailer = require("nodemailer");
const UserModel = require("../models/user");
const ProductModel = require("../models/product");

async function sendEmail({ to, subject, html }) {
  try {
      let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.gmail,
              pass: process.env.gmailPass,
          },
      });

      let info = await transporter.sendMail({
          from: `"Printing Press HU" <${process.env.gmail}>`,
          to: to,
          subject: subject,
          html: html,
      });

      return true;
  } catch (error) {
      console.error("Failed to send email:", error);
      return false;
  }
}

async function sendVerificationEmail(to, verificationCode, userName) {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #007bff; text-align: center;">Welcome, ${userName}!</h1>
              <p style="font-size: 16px; text-align: center;">Thank you for choosing our service.</p>
              <p style="font-size: 16px;">To complete your registration, please use the verification code below:</p>
              <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 24px; margin: 20px auto; max-width: 200px;">${verificationCode}</div>
              <p style="font-size: 16px;">Your security is important to us. Please do not share this code with anyone else.</p>
              <p style="font-size: 16px;">Thank you,<br/>The Team</p>
          </div>
      </div>
    `;

    const subject = 'Email Verification';

    // Send email
    await sendEmail({ to, subject, html: htmlContent });

    return true; // Email sent successfully
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return false; // Failed to send email
  }
}


async function sendPasswordResetEmail(to, resetCode) {
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
          <div style="background-color: #ffffff; border-radius: 10px; padding: 20px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <h1 style="color: #007bff; text-align: center;">Password Reset</h1>
              <p style="font-size: 16px; text-align: center;">You have requested to reset your password.</p>
              <p style="font-size: 16px;">Please use the reset code below:</p>
              <div style="background-color: #007bff; color: #ffffff; padding: 10px; text-align: center; border-radius: 5px; font-size: 24px; margin: 20px auto; max-width: 200px;">${resetCode}</div>
              <p style="font-size: 16px;">If you did not request this password reset, please ignore this email.</p>
              <p style="font-size: 16px;">Thank you,<br/>The Team</p>
          </div>
      </div>
  `;

  const subject = 'Password Reset';

  return await sendEmail({ to, subject, html: htmlContent });
}

const generateEmailContentForUpdateOrderStatus = async (order) => {
  try {
    const product = await ProductModel.findById(order.product.product_id).exec();
    const productName = product ? product.name : 'Unknown Product';

    return `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
    <p style="font-size: 16px; margin-bottom: 10px;">Dear Customer,</p>
    <p style="font-size: 14px; margin-bottom: 15px;">We're writing to inform you that the status of your order with ID <strong>${order._id}</strong> has been updated.</p>
    <p style="font-size: 14px; margin-bottom: 15px;"><strong>Order Details:</strong></p>
    <ul style="font-size: 14px; list-style-type: none; padding: 0;">
      <li><strong>Product:</strong> ${productName}</li>
      <li><strong>Quantity:</strong> ${order.product.quantity}</li>
      <li><strong>Status:</strong> ${order.status}</li>
    </ul>
    <p style="font-size: 14px; margin-top: 15px;">Thank you for choosing us.</p>
  </div>
    `;
  } catch (error) {
    return false;
  }
};

const generateEmailContentForOrderAccept = async (order) => {
  try {
    return `
    <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px; margin-top: 20px;">
    <p style="font-size: 16px; margin-bottom: 10px;">Dear Customer,</p>
    <p style="font-size: 14px; margin-bottom: 15px;">We are pleased to inform you that your order with Printing Press HU has been accepted.</p>
    <p style="font-size: 14px; margin-bottom: 15px;">Please review the invoice in your account and proceed with payment at your earliest convenience.</p>
    <p style="font-size: 14px;">Thank you for choosing our services!</p>
  </div>
    `;
  } catch (error) {
    return false;
  }
};

const generateEmailContentForOrderDeny = (order) => {
  return `
  <div style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; padding: 20px; border: 1px solid #ccc; border-radius: 5px; margin-top: 20px;">
  <p style="font-size: 16px; margin-bottom: 10px;">Dear Customer,</p>
  <p style="font-size: 14px; margin-bottom: 15px;">We regret to inform you that your order with ID <strong>${order._id}</strong> has been denied.</p>
  <p style="font-size: 14px; margin-bottom: 15px;">If you have any queries, please don't hesitate to contact us.</p>
  <p style="font-size: 14px;">Thank you for your understanding.</p>
</div>
  `;
};
  
const sendEmailForOrderUpdateOrderStatus = async (order) => {
    const htmlContent = await generateEmailContentForUpdateOrderStatus(order);
    const subject = 'Order Update';
    const to = order.user_email;
  
    try {
      await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      return false;

    }
};

const sendEmailForOrderAccept = async (order) => {
    const htmlContent = await generateEmailContentForOrderAccept(order);
    const subject = 'Order Accepted';
    const to = order.user_email;
  
    try {
      await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      return false;

    }
};
  
const sendEmailForOrderDeny = async (order) => {
    const htmlContent = generateEmailContentForOrderDeny(order);
    const subject = 'Order Denial';
    const to = order.user_email;
  
    try {
      await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      return false;

    }
};

const sendAdminMessageEmail = async ({ to, message }) => {
  const subject = 'Message from Admin';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 2px solid #ccc;">
      <p style="font-size: 16px;">Dear User,</p>
      <p style="font-size: 14px;">${message}</p>
      <p style="font-size: 14px;">Please take necessary action accordingly.</p>
    </div>
  `;

  try {
    await sendEmail({ to, subject, html: htmlContent });
  } catch (error) {
    next(error);
  }
};
  
async function getUserEmailById(userId) {
    try {
      const user = await UserModel.findById(userId).exec();
      if (!user) {
        throw new Error("User not found");
      }
      return user.email;
    } catch (error) {
      next(error);
    }
}

module.exports = { 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendEmailForOrderUpdateOrderStatus, 
    sendEmailForOrderAccept,
    sendEmailForOrderDeny, 
    sendAdminMessageEmail,
    getUserEmailById 
};
