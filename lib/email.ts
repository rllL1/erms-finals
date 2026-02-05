import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface WelcomeEmailParams {
  to: string
  name: string
  email: string
  password: string
  userType: 'student' | 'teacher'
}

export async function sendWelcomeEmail({
  to,
  name,
  email,
  password,
  userType,
}: WelcomeEmailParams): Promise<{ success: boolean; error?: string }> {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const logoUrl = `${loginUrl}/public/234.png`

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Account Has Been Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); border-radius: 12px 12px 0 0;">
              <img src="${logoUrl}" alt="School Logo" style="width: 120px; height: auto; margin-bottom: 20px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Welcome to St. Dominic Savio College</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 20px;">Your Account Has Been Created</h2>
              
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi <strong>${name}</strong>,
              </p>
              
              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Your ${userType} account has been successfully created. You can now access the Exam Record Management System using the credentials below.
              </p>
              
              <!-- Login Details Box -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 16px 0; color: #0369a1; font-size: 16px; font-weight: 600;">
                  📧 Login Details
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">Email:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Password:</td>
                    <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; font-family: monospace; background-color: #fef3c7; padding-left: 8px; border-radius: 4px;">${password}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Login Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${loginUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  Access the System
                </a>
              </div>
              
              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⚠️ <strong>Security Notice:</strong> For security reasons, please change your password after your first login or contact the administrator for more info.
                </p>
              </div>
              
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.5;">
                This is an automated message from the Exam Record Management System.<br>
                Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const textContent = `
Your Account Has Been Created

Hi ${name},

Your ${userType} account has been successfully created.

Login Details:
Email: ${email}
Password: ${password}

Please click the link below to access the system:
${loginUrl}/login

For security reasons, please change your password after your first login or contact the administrator for more info.

Thank you.
`

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"School Admin" <noreply@school.com>',
      to,
      subject: 'Your Account Has Been Created',
      text: textContent,
      html: htmlContent,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}
