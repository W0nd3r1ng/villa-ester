const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const mailOptions = {
  from: `"Villa Ester Resort" <${process.env.EMAIL_USER}>`,
  to: 'dumpstermail000@gmail.com',
  subject: 'Test Email from Villa Ester Resort',
  text: 'This is a test email to confirm your email setup is working.',
  html: '<p>This is a <b>test email</b> to confirm your email setup is working.</p>'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    return console.error('Error sending test email:', error);
  }
  console.log('Test email sent:', info.response);
}); 