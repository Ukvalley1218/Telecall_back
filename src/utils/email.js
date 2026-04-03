import logger from './logger.js';

/**
 * Email utility for sending emails
 * In production, configure with nodemailer or any email service
 */

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (options) => {
  try {
    // In development, just log the email
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        text: options.text ? options.text.substring(0, 100) + '...' : 'No text content'
      });

      return {
        success: true,
        message: 'Email logged (development mode)',
        messageId: `dev-${Date.now()}`
      };
    }

    // In production, use nodemailer or any email service
    // Example configuration (uncomment and configure):
    /*
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    return {
      success: true,
      messageId: info.messageId
    };
    */

    // Placeholder for production - configure with your email service
    logger.info('Email sending not configured for production');
    return {
      success: false,
      message: 'Email service not configured'
    };
  } catch (error) {
    logger.error('Send email error:', error);
    return {
      success: false,
      message: error.message || 'Failed to send email'
    };
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Password reset URL
 * @returns {Promise<Object>} Send result
 */
export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  const subject = 'Password Reset Request';
  const text = `You are receiving this email because you (or someone else) has requested a password reset.

Your password reset token is: ${resetToken}

Click the following link to reset your password: ${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.

This token will expire in 1 hour.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) has requested a password reset.</p>
      <p>Your password reset token is:</p>
      <div style="background-color: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px; font-family: monospace;">
        ${resetToken}
      </div>
      <p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you did not request this, please ignore this email and your password will remain unchanged.
      </p>
      <p style="color: #666; font-size: 14px;">
        This token will expire in <strong>1 hour</strong>.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

/**
 * Send welcome email to new telecaller
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} tempPassword - Temporary password
 * @returns {Promise<Object>} Send result
 */
export const sendTelecallerWelcomeEmail = async (email, name, tempPassword) => {
  const subject = 'Welcome to Telecalling Team';
  const text = `Hello ${name},

Welcome to the Telecalling Team! Your account has been created.

Your login credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Please log in and change your password immediately.

Login URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

If you have any questions, please contact your administrator.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to the Telecalling Team!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully.</p>
      <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <p style="color: #e74c3c; font-weight: bold;">Please log in and change your password immediately.</p>
      <p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Login Now
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">
        If you have any questions, please contact your administrator.
      </p>
    </div>
  `;

  return sendEmail({ to: email, subject, text, html });
};

export default sendEmail;