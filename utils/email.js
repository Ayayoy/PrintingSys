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

  return await sendEmail({ to, subject, html: htmlContent });
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
        // Fetch the product details using product_id from the order
        const product = await ProductModel.findById(order.product.product_id).exec();
        const productName = product ? product.name : 'Unknown Product'; // Get product name

        return `
          <p>Dear User,</p>
          <p>Your order status with ID ${order._id} has been updated.</p>
          <p>Details:</p>
          <ul>
            <li>Product: ${productName}</li> <!-- Use product name -->
            <li>Quantity: ${order.product.quantity}</li>
            <li>Status: ${order.status}</li>
          </ul>
          <p>Thank you for choosing us.</p>
        `;
    } catch (error) {
      return false;
    }
};

const generateEmailContentForOrderAccept = async (order) => {
    try {
        return `
          <p>Dear User,</p>
          <p>Your order with our printing press has been accepted.</p>
          <p>Check the invoice in yout account, Please pay as soon as possible..</p>
          <p>Thank you for your order!</p>
        `;
    } catch (error) {
      return false;
    }
};

const generateEmailContentForOrderDeny = (order) => {
    return `
      <p>Dear User,</p>
      <p>We regret to inform you that your order with ID ${order._id} has been denied.</p>
      <p>If you have any questions, please feel free to contact us.</p>
      <p>Thank you for your understanding.</p>
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

async function sendAdminMessageEmail({ to, message }) {
    const subject = 'Message from Admin';
    const htmlContent = `
        <p>Dear User,</p>
        <p>${message}</p>
        <p>Please take necessary action accordingly.</p>
    `;

    try {
        await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      next(error);
    }
}
  
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
