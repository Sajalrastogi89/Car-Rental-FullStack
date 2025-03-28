const nodemailer = require('nodemailer');

// Create a transporter using SMTP settings
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send an email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @returns {Promise} - Resolves with info about the email sending
 */
const sendMail = async (options) => {
  try {
    const mailOptions = {
      from: `"EZYCAR" <${process.env.EMAIL_USERNAME}>`,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};

/**
 * Send a bid acceptance email notification with enhanced details
 * @param {Object} data - Bid and user data
 * @param {string} data.userEmail - User email address
 * @param {string} data.userName - User's name
 * @param {string} data.carName - Name/model of the car
 * @param {number} data.bidAmount - Accepted bid amount
 * @param {string} data.ownerName - Car owner's name
 * @param {string} data.ownerEmail - Car owner's email
 * @param {string} data.ownerPhone - Car owner's phone number (optional)
 * @param {string} data.startDate - Booking start date (optional)
 * @param {string} data.endDate - Booking end date (optional)
 * @param {string} data.city - Car location (optional)
 * @param {string} data.image - Car image URL (optional)
 * @param {string} data.carDetails - Additional car details (optional)
 * @returns {Promise} - Email sending result
 */
const sendBidAcceptedEmail = async (data) => {
  const subject = `Great News! Your Bid for ${data.carName} Has Been Accepted`;
  
  // Format dates for display if provided
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const startDate = data.startDate ? formatDate(data.startDate) : '';
  const endDate = data.endDate ? formatDate(data.endDate) : '';
  
  // Calculate duration if dates are available
  let durationText = '';
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))+1;
    durationText = `<p><strong>Duration:</strong> ${durationDays} day${durationDays !== 1 ? 's' : ''}</p>`;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px; background-color: #4CAF50; padding: 15px; border-radius: 5px; color: white;">
        <h1 style="margin-top: 0;">Congratulations, ${data.userName}!</h1>
        <p style="font-size: 18px; margin-bottom: 0;">Your bid has been accepted.</p>
      </div>
      
      <!-- Car Image (if available) -->
      ${data.image ? `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${data.image}" alt="${data.carName}" style="max-width: 100%; max-height: 250px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      </div>
      ` : ''}
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #4CAF50;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">Bid Details:</h2>
        <p><strong>Car:</strong> ${data.carName}</p>
        ${data.carDetails ? `<p><strong>Details:</strong> ${data.carDetails}</p>` : ''}
        ${data.city ? `<p><strong>Location:</strong> ${data.city}</p>` : ''}
        <p><strong>Bid Amount:</strong> $${data.bidAmount.toFixed(2)}</p>
        ${startDate ? `<p><strong>Start Date:</strong> ${startDate}</p>` : ''}
        ${endDate ? `<p><strong>End Date:</strong> ${endDate}</p>` : ''}
        ${durationText}
      </div>
      
      <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Next Steps:</h2>
        <p>Please contact the car owner to finalize your purchase and arrange payment using the details below:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          <p style="margin-top: 0;"><strong>Owner:</strong> ${data.ownerName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.ownerEmail}" style="color: #4CAF50; text-decoration: none;">${data.ownerEmail}</a></p>
          ${data.ownerPhone ? `<p style="margin-bottom: 0;"><strong>Phone:</strong> <a href="tel:${data.ownerPhone}" style="color: #4CAF50; text-decoration: none;">${data.ownerPhone}</a></p>` : ''}
        </div>
      </div>
      
      <div style="background-color: #e8f5e9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h2 style="color: #2E7D32; margin-top: 0; margin-bottom: 15px;">Important Information</h2>
        <ul style="padding-left: 20px; margin-bottom: 0;">
          <li>You should receive a confirmation email with complete details shortly.</li>
          <li>Don't forget to bring your driver's license and a valid ID when picking up the car.</li>
          <li>Contact the owner directly for any special accommodations or questions.</li>
          <li>Check your car thoroughly before accepting the keys.</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p>Thank you for using EZYCAR.</p>
        <div style="margin-top: 15px;">
          <a href="process.env.EMAIL_USERNAME" style="display: inline-block; background-color: #f5f5f5; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Contact Support</a>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 20px;">This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendMail({
    to: data.userEmail,
    subject,
    html
  });
};

/**
 * Send a bid rejection email notification with enhanced details
 * @param {Object} data - Bid and user data
 * @param {string} data.userEmail - User email address
 * @param {string} data.userName - User's name
 * @param {string} data.carName - Name/model of the car
 * @param {number} data.bidAmount - Rejected bid amount
 * @param {string} data.city - Car location (optional)
 * @param {string} data.image - Car image URL (optional)
 * @param {string} data.carDetails - Additional car details (optional)
 * @param {string} data.startDate - Booking start date (optional)
 * @param {string} data.endDate - Booking end date (optional)
 * @param {string} data.reason - Rejection reason (optional)
 * @returns {Promise} - Email sending result
 */
const sendBidRejectedEmail = async (data) => {
  const subject = `Update on Your Bid for ${data.carName}`;
  
  // Format dates for display if provided
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  const startDate = data.startDate ? formatDate(data.startDate) : '';
  const endDate = data.endDate ? formatDate(data.endDate) : '';
  
  // Calculate duration if dates are available
  let durationText = '';
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))+1;
    durationText = `<p><strong>Duration:</strong> ${durationDays} day${durationDays !== 1 ? 's' : ''}</p>`;
  }
  
  // Get current date for the email
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px; background-color: #607D8B; padding: 15px; border-radius: 5px; color: white;">
        <h1 style="margin-top: 0;">Hello, ${data.userName}</h1>
        <p style="font-size: 18px; margin-bottom: 0;">We have an update on your bid.</p>
      </div>
      
      <!-- Car Image (if available) -->
      ${data.image ? `
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${data.image}" alt="${data.carName}" style="max-width: 100%; max-height: 250px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      </div>
      ` : ''}
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #607D8B;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">Bid Details:</h2>
        <p><strong>Car:</strong> ${data.carName}</p>
        ${data.carDetails ? `<p><strong>Details:</strong> ${data.carDetails}</p>` : ''}
        ${data.city ? `<p><strong>Location:</strong> ${data.city}</p>` : ''}
        <p><strong>Bid Amount:</strong> $${data.bidAmount.toFixed(2)}</p>
        ${startDate ? `<p><strong>Requested Start Date:</strong> ${startDate}</p>` : ''}
        ${endDate ? `<p><strong>Requested End Date:</strong> ${endDate}</p>` : ''}
        ${durationText}
        <p style="color: #F44336; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">Status: Not Accepted</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p><strong>Date:</strong> ${currentDate}</p>
      </div>
      
      <div style="margin-bottom: 20px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">What's Next?</h2>
        <p>We understand this might be disappointing, but don't worry! There are many other great cars available on EZYCAR that might be perfect for your needs.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="color: #1976D2; margin-top: 0;">Your Options:</h3>
          <ul style="padding-left: 20px; margin-bottom: 0;">
            <li>Browse our extensive collection of available cars</li>
            <li>Place a new bid with a different amount</li>
            <li>Save your favorite cars for future reference</li>
            <li>Set up alerts for new cars that match your preferences</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p>Thank you for your interest in EZYCAR.</p>
        <div style="margin-top: 15px;">
          <a href="http://ezycar.com/support" style="display: inline-block; background-color: #f5f5f5; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Contact Support</a>
        </div>
        <p style="font-size: 12px; color: #777; margin-top: 20px;">This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendMail({
    to: data.userEmail,
    subject,
    html
  });
};

// Add the new functions to the module exports
module.exports = {
  sendMail,
  sendBidAcceptedEmail,
  sendBidRejectedEmail
};