const { Resend } = require('resend');

/**
 * Utility to send emails via Resend.
 * Bypasses API requests and logs email details to the console if RESEND_API_KEY is not configured,
 * ensuring seamless local development.
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - Branded HTML body
 */
const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey === 'your_resend_api_key' || apiKey.trim() === '') {
    console.log('\n==================================================');
    console.log('📬 [EMAIL SEND BYPASS (No RESEND_API_KEY Configured)]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    console.log('Body (HTML):');
    console.log(html);
    console.log('==================================================\n');
    return { success: true, bypassed: true };
  }

  const resend = new Resend(apiKey);
  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Cafe Ordering System <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    throw error;
  }
};

module.exports = sendEmail;
