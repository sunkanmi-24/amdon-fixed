require('dotenv').config();
const { google } = require('googleapis');

// ─── Gmail API Setup ───────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

// Set refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// ─── Send email via Gmail API ────────────────────────────────────
async function sendEmailWithLogging(mailOptions) {
  const startTime = Date.now();
  const messageId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📤 [${messageId}] Sending via Gmail API to: ${mailOptions.to}`);

  try {
    // Get fresh access token
    const accessToken = await oauth2Client.getAccessToken();
    
    if (!accessToken.token) {
      throw new Error('Failed to get access token - check refresh token');
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build email message
    const messageParts = [
      `From: ${mailOptions.from || process.env.EMAIL_FROM}`,
      `To: ${mailOptions.to}`,
      `Subject: ${mailOptions.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      mailOptions.html,
    ];
    
    const message = messageParts.join('\n');
    
    // Encode for Gmail API (URL-safe base64)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    const duration = Date.now() - startTime;
    
    console.log(`✅ [${messageId}] Email sent in ${duration}ms`);
    console.log(`   Gmail Message ID: ${response.data.id}`);
    
    return { 
      success: true, 
      messageId: response.data.id,
      gmailId: response.data.id 
    };
    
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${messageId}] Email failed after ${duration}ms`);
    console.error(`   Error: ${err.message}`);
    
    if (err.response?.data?.error) {
      console.error(`   Gmail API Error:`, err.response.data.error);
    }
    
    // Specific error handling
    if (err.message.includes('invalid_grant')) {
      console.error('   💡 Diagnosis: Refresh token expired or invalid. Regenerate at OAuth Playground.');
    }
    
    throw err;
  }
}

// ─── Fire-and-forget wrapper ────────────────────────────────────
function sendEmailAsync(mailOptions, onError) {
  setImmediate(async () => {
    try {
      await sendEmailWithLogging(mailOptions);
    } catch (err) {
      console.error(`❌ Async email failed to ${mailOptions.to}:`, err.message);
      if (onError && typeof onError === 'function') {
        onError(err);
      }
    }
  });
}

// ─── Email Templates (unchanged) ─────────────────────────────────
function emailWrapper(title, bodyHtml) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f5f7fa;padding:20px;">
      <div style="background:#1a3c5e;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:22px;letter-spacing:1px;">AMDON Portal</h1>
        <p style="color:#a0c4e8;margin:4px 0 0;font-size:13px;">Automobile Dealers Association of Nigeria</p>
      </div>
      <div style="background:white;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;">
        <h2 style="color:#1a3c5e;margin:0 0 16px;font-size:18px;">${title}</h2>
        ${bodyHtml}
        <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:11px;margin:0;text-align:center;">
          This is an automated message from the AMDON Portal. Do not reply.
        </p>
      </div>
    </div>
  `;
}

function codeBlock(code) {
  return `
    <div style="background:#f0f7ff;border:2px dashed #1a3c5e;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
      <p style="color:#64748b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">Your Code</p>
      <h1 style="color:#1a3c5e;font-size:38px;font-weight:900;letter-spacing:10px;margin:0;font-family:monospace;">${code}</code></h1>
    </div>
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:8px 0 0;">
      This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
    </p>
  `;
}

// ─── 1. Registration confirmation email ─────────────────────────
async function sendConfirmationEmail({ to, fullName, memberId }) {
  console.log(`📝 sendConfirmationEmail called for ${to}, Member ID: ${memberId}`);
  
  try {
    await sendEmailWithLogging({
      from: process.env.EMAIL_FROM,
      to,
      subject: `AMDON Registration Successful — Your Member ID: ${memberId}`,
      html: emailWrapper('Registration Successful!', `
        <p style="color:#374151;">Dear <strong>${fullName}</strong>,</p>
        <p style="color:#374151;">Your AMDON registration was successful. Here is your unique Member ID:</p>
        <div style="background:#1a3c5e;border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
          <p style="color:#a0c4e8;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:1px;">Member ID</p>
          <h1 style="color:white;font-size:28px;letter-spacing:3px;margin:0;font-family:monospace;">${memberId}</h1>
        </div>
        <p style="color:#374151;">Keep this ID safe — you will need it to access your dashboard and verify membership.</p>
      `),
    });
    console.log(`✅ Confirmation email completed for ${to}`);
  } catch (err) {
    console.error(`❌ sendConfirmationEmail failed for ${to}:`, err.message);
    throw err;
  }
}

// ─── 2. Email verification OTP ──────────────────────────────────
async function sendVerificationEmail({ to, fullName, code }) {
  console.log(`📝 sendVerificationEmail called for ${to}, code: ${code}`);
  
  try {
    const result = await sendEmailWithLogging({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'AMDON — Verify Your Email Address',
      html: emailWrapper('Verify Your Email', `
        <p style="color:#374151;">Hi <strong>${fullName}</strong>,</p>
        <p style="color:#374151;">
          Thank you for registering with AMDON. Please enter the verification code below 
          to confirm your email address and activate your account.
        </p>
        ${codeBlock(code)}
      `),
    });
    console.log(`✅ Verification email sent to ${to}`);
    return result;
  } catch (err) {
    console.error(`❌ sendVerificationEmail failed for ${to}:`, err.message);
    throw err;
  }
}

// ─── 3. Password reset OTP ──────────────────────────────────────
async function sendPasswordResetEmail({ to, code }) {
  console.log(`📝 sendPasswordResetEmail called for ${to}`);
  
  try {
    const result = await sendEmailWithLogging({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'AMDON — Password Reset Code',
      html: emailWrapper('Reset Your Password', `
        <p style="color:#374151;">
          We received a request to reset the password for your AMDON account 
          associated with <strong>${to}</strong>.
        </p>
        <p style="color:#374151;">Enter the code below to proceed with resetting your password:</p>
        ${codeBlock(code)}
        <p style="color:#ef4444;font-size:13px;">
          If you did not request a password reset, please ignore this email. 
          Your password will remain unchanged.
        </p>
      `),
    });
    console.log(`✅ Password reset email sent to ${to}`);
    return result;
  } catch (err) {
    console.error(`❌ sendPasswordResetEmail failed for ${to}:`, err.message);
    throw err;
  }
}

module.exports = {
  sendConfirmationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailWithLogging,
};