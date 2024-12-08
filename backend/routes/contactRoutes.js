require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const router = express.Router();

// Create the Nodemailer transporter using environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // Use the email host from .env
  port: process.env.EMAIL_PORT, // Use the email port from .env
  secure: false, // If using a service like Gmail, set this to false
  auth: {
    user: process.env.EMAIL_USER, // Your email from .env
    pass: process.env.EMAIL_PASS, // Your app-specific password from .env
  },
});

// Middleware to parse incoming request bodies
const app = express();
app.use(express.json()); // This is required to parse JSON data in POST requests

// Contact Us route handler
router.post('/', (req, res) => {
  // Ensure all required fields are provided
  if (!req.body || !req.body.name || !req.body.email || !req.body.message) {
    return res.status(400).json({ message: 'Please fill in all fields.' });
  }

  const { name, email, message } = req.body;

  // Define the email options
  const mailOptions = {
    from: email, // sender address
    to: process.env.EMAIL_TO, // receiver address from .env
    subject: 'New Contact Us Message',
    text: `Message from: ${name} (${email})\n\n${message}`,
  };

  // Send email using Nodemailer
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).json({ message: 'Error sending email.' });
    }
    res.status(200).json({ message: 'Message sent successfully!' });
  });
});

// Export router to use in app.js
module.exports = router;
