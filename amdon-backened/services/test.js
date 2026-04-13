// test-email.js
require('dotenv').config();
const { sendVerificationEmail, sendConfirmationEmail } = require('./emailService');

async function test() {
  console.log('🧪 Testing email configuration...\n');
  
  // Test 1: Basic verification email
  try {
    await sendVerificationEmail({
      to:  'hassanmahmud2123@example.com',
      fullName: 'Test User',
      code: '123456',
    });
    console.log('\n✅ Test 1 PASSED: Verification email sent');
  } catch (err) {
    console.error('\n❌ Test 1 FAILED:', err.message);
  }

  // Test 2: Confirmation email with Member ID
  try {
    await sendConfirmationEmail({
      to: 'exploitdeveloper0@example.com',
      fullName: 'Test User',
      memberId: 'AMD-TEST-001',
    });
    console.log('\n✅ Test 2 PASSED: Confirmation email sent');
  } catch (err) {
    console.error('\n❌ Test 2 FAILED:', err.message);
  }
}

test();