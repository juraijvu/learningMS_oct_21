# Password Reset Functionality

## Overview

The system now includes a secure password reset functionality that allows administrators to reset user passwords and send new login credentials via email.

## Important Security Note

**Original passwords cannot be retrieved** because they are encrypted using bcrypt hashing. When an admin "resends" a password, the system actually generates a **new temporary password** and replaces the old one.

## How It Works

### For Administrators

1. **Navigate to User Management**: Go to Admin → Users
2. **Find the User**: Search for the user whose password needs to be reset
3. **Reset Password**: Click the three-dot menu next to the user and select "Reset Password"
4. **Confirmation**: The system will ask for confirmation and explain what will happen
5. **New Password Generated**: A new temporary password is generated and the old password is invalidated
6. **Email Sent**: The user receives an email with their new login credentials
7. **Admin Notification**: The admin sees the new password for reference

### For Users

1. **Receive Email**: User gets a "Password Reset by Administrator" email
2. **Login with New Password**: Use the temporary password provided in the email
3. **Forced Password Change**: System requires user to change password on first login
4. **Set New Password**: User creates their own secure password

## API Endpoints

### Reset Password
```
POST /api/admin/users/:userId/reset-password
```

**Response:**
```json
{
  "message": "Password reset successfully. User will receive an email with new login credentials.",
  "temporaryPassword": "abc123def",
  "username": "john.doe",
  "email": "john@example.com"
}
```

### Resend Welcome Email (Legacy)
```
POST /api/admin/users/:userId/resend-email
```

This endpoint also generates a new password but sends a welcome email format instead of a password reset email.

## Email Templates

### Password Reset Email
- **Subject**: "Orbit LMS - Password Reset by Administrator"
- **Content**: Explains that password was reset by admin
- **Styling**: Red theme to indicate security action
- **Instructions**: Clear steps for user to login and change password

### Welcome Email (Legacy)
- **Subject**: "Welcome to Orbit LMS - Your Account Details"
- **Content**: Welcome message for new users
- **Styling**: Blue theme for welcome
- **Instructions**: General onboarding steps

## Security Features

1. **Password Encryption**: All passwords are hashed using bcrypt
2. **Forced Password Change**: Users must change temporary passwords on first login
3. **Activity Logging**: All password resets are logged for audit purposes
4. **Email Verification**: Only users with valid email addresses can receive resets
5. **Admin Confirmation**: Admins must confirm before resetting passwords

## Activity Logging

All password reset actions are logged with:
- Admin who performed the reset
- Target user affected
- Timestamp
- IP address
- Action type: `password_reset_by_admin`

## Best Practices

### For Administrators
1. **Verify Identity**: Ensure you're resetting the password for the correct user
2. **Secure Communication**: Share temporary passwords through secure channels if needed
3. **Follow Up**: Confirm with users that they received the reset email
4. **Document Reasons**: Keep records of why password resets were necessary

### For Users
1. **Change Password Immediately**: Don't delay changing the temporary password
2. **Use Strong Passwords**: Create passwords with good complexity
3. **Don't Share Credentials**: Keep login information confidential
4. **Report Issues**: Contact admin if you don't receive the reset email

## Troubleshooting

### User Doesn't Receive Email
1. Check if user has a valid email address in the system
2. Verify email isn't in spam/junk folder
3. Check SMTP configuration in server settings
4. Try resending the email

### User Can't Login with New Password
1. Verify the correct username is being used
2. Check if password was copied correctly (no extra spaces)
3. Ensure caps lock is off
4. Try resetting the password again

### Email Service Issues
1. Check SMTP configuration in `.env` file
2. Verify SMTP credentials are correct
3. Test email service connectivity
4. Check server logs for email sending errors

## Configuration

### Environment Variables
```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FRONTEND_URL=https://your-lms-domain.com
```

### Email Service Setup
The system uses Nodemailer with SMTP configuration. Ensure your email provider allows SMTP access and has the correct settings configured.

## Future Enhancements

Potential improvements to consider:
1. **Password Complexity Requirements**: Enforce stronger password policies
2. **Multi-Factor Authentication**: Add 2FA for enhanced security
3. **Password History**: Prevent reuse of recent passwords
4. **Bulk Password Reset**: Reset multiple users at once
5. **Self-Service Reset**: Allow users to reset their own passwords
6. **Temporary Password Expiration**: Set time limits on temporary passwords