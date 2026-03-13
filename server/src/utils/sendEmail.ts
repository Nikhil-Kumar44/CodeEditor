import { Resend } from 'resend';

interface EmailOptions {
  email: string
  subject: string
  message: string
}

export const sendEmail = async (options: EmailOptions) => {
  // If no RESEND_API_KEY is found (testing locally), simulate the email
  if (!process.env.RESEND_API_KEY) {
    console.log(`✉️ [DEV MODE] Email to ${options.email} skipped.`)
    console.log(`✉️ Subject: ${options.subject}`)
    console.log(`✉️ Body: \n${options.message}`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Note: On free Resend accounts without a verified domain, 
  // you MUST send from "onboarding@resend.dev" to your OWN registered email address
  try {
    const data = await resend.emails.send({
      from: 'CollabCode Team <onboarding@resend.dev>',
      to: [options.email],
      subject: options.subject,
      text: options.message,
    });
    
    console.log('✅ Resend message accepted:', data);
  } catch (error) {
    console.error('❌ Resend API error:', error);
    throw new Error('Email sending failed via Resend API');
  }
}
