const nodemailer = require("nodemailer");
const UserModel = require("../models/user");
const ProductModel = require("../models/product");

async function sendEmail({ to, subject, html }) {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.gmail, // sender email address
                pass: process.env.gmailPass, // sender email password
            },
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: `"Printing Press HU" <${process.env.gmail}>`, // sender address
            to: to, // recipient email address
            subject: subject, // email subject
            html: html, // email content in HTML format
        });

    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

async function sendVerificationEmail(to, verificationToken) {
    const verificationLink = `http://localhost:4000/auth/verify-email/${verificationToken}`;

    const htmlContent = `
        <p>Dear User,</p>
        <p>Please click the following link to verify your email:</p>
        <a href="${verificationLink}">${verificationLink}</a>
    `;

    const subject = 'Email Verification';

    return await sendEmail({ to, subject, html: htmlContent });
}

async function sendPasswordResetEmail(to, resetToken) {
    const resetLink = `http://localhost:4000/auth/reset-password/${resetToken}`;

    const htmlContent = `
        <p>Dear User,</p>
        <p>Please click the following link to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
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
        console.error('Error generating email content for order update:', error);
        return '';
    }
};

const generateEmailContentForOrderAccept = async (order) => {
    try {
        // Fetch the product details using product_id from the order
        const product = await ProductModel.findById(order.product.product_id).exec();
        const productName = product ? product.name : 'Unknown Product'; // Get product name

        return `
          <p>Dear User,</p>
          <p>Your order with ID ${order._id} has been accepted.</p>
          <p>Details:</p>
          <ul>
            <li>Product: ${productName}</li> <!-- Use product name -->
            <li>Quantity: ${order.product.quantity}</li>
            <li>Total Cost: ${order.total_cost}</li>
            <li>Status: ${order.status}</li>
          </ul>
          <p>Please make the payment as soon as possible to complete the order.</p>
          <p>Thank you for your order!</p>
        `;
    } catch (error) {
        console.error('Error generating email content for order acceptance:', error);
        return '';
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
      console.error('Error sending email for order update:', error);
    }
};

const sendEmailForOrderAccept = async (order) => {
    const htmlContent = await generateEmailContentForOrderAccept(order);
    const subject = 'Order Accepted';
    const to = order.user_email;
  
    try {
      await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      console.error('Error sending email for order acceptance:', error);
    }
};
  
const sendEmailForOrderDeny = async (order) => {
    const htmlContent = generateEmailContentForOrderDeny(order);
    const subject = 'Order Denial';
    const to = order.user_email;
  
    try {
      await sendEmail({ to, subject, html: htmlContent });
    } catch (error) {
      console.error('Error sending email for order denial:', error);
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
        console.error('Error sending admin message email:', error);
        return false;
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
      throw new Error(`Error fetching user email: ${error.message}`);
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
