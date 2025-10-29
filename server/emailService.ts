import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    console.log('Email config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      pass: config.auth.pass ? '***' : 'NOT SET'
    });

    this.transporter = nodemailer.createTransport(config);
  }

  async sendWelcomeEmail(
    userEmail: string,
    firstName: string,
    lastName: string,
    username: string,
    temporaryPassword: string,
    role: string
  ) {
    const mailOptions = {
      from: `"Orbit LMS" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: 'Welcome to Orbit LMS - Your Account Details',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Welcome to Orbit LMS!</h1>
              <p>Your Learning Management System Account</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName} ${lastName},</h2>
              <p>Your account has been created successfully! You can now access the Orbit Learning Management System with your role as <strong>${role.replace('_', ' ').toUpperCase()}</strong>.</p>
              
              <div class="credentials">
                <h3>🔐 Your Login Credentials:</h3>
                <p><strong>Username:</strong> ${username}</p>
                <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL || 'https://lms.orbittraining.online'}</p>
              </div>

              <div class="warning">
                <h3>⚠️ Important Security Notice:</h3>
                <p><strong>You must change your password on first login</strong> for security reasons. This temporary password will expire after your first successful login.</p>
              </div>

              <h3>🎯 What's Next?</h3>
              <ol>
                <li>Click the login button below or visit the login URL</li>
                <li>Enter your username and temporary password</li>
                <li>You'll be prompted to create a new secure password</li>
                <li>Start exploring your personalized dashboard!</li>
              </ol>

              <a href="${process.env.FRONTEND_URL || 'https://lms.orbittraining.online'}" class="button">Login to Orbit LMS</a>

              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="font-size: 12px; color: #6b7280;">
                This is an automated message from Orbit LMS. Please do not reply to this email.
                <br>For security reasons, please do not share your login credentials with anyone.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${userEmail}:`, info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error to prevent user creation failure
      return null;
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();