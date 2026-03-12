import nodemailer from 'nodemailer'

interface EmailOptions {
  email: string
  subject: string
  message: string
}

export const sendEmail = async (options: EmailOptions) => {
  let transporter

  // Use Ethereal for testing if proper credentials aren't provided
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    })
    console.log(`✉️ Using Ethereal Email for testing purposes...`)
  } else {
    // Production / Configured setup
    const port = Number(process.env.SMTP_PORT) || 587
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports like 587
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  const message = {
    from: `${process.env.FROM_NAME || 'CollabCode'} <${process.env.FROM_EMAIL || 'noreply@collabcode.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // Add html: '<p>HTML version of message</p>' here if you want rich emails
  }

  const info = await transporter.sendMail(message)

  console.log('Message sent: %s', info.messageId)

  // Explicitly note the preview URL if using ethereal
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
  }
}
