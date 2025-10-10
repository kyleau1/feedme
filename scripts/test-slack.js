// Simple test script for Slack webhook
const https = require('https');

// Test data
const testSession = {
  id: 'test-session-123',
  restaurant_name: 'Test Restaurant',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
  doordash_group_link: 'https://example.com/test-link',
  created_by: 'test-user',
  company_id: 'test-company'
};

// Get webhook URL from environment or prompt user
const webhookUrl = process.env.SLACK_WEBHOOK_URL || process.argv[2];

if (!webhookUrl) {
  console.log('❌ No webhook URL provided!');
  console.log('Usage: node scripts/test-slack.js <webhook-url>');
  console.log('Or set SLACK_WEBHOOK_URL environment variable');
  process.exit(1);
}

async function sendSlackMessage(message) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);
    const postData = JSON.stringify({
      channel: process.env.SLACK_CHANNEL || '#general',
      ...message
    });

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testSlackIntegration() {
  console.log('🧪 Testing Slack integration...');
  console.log('📡 Webhook URL:', webhookUrl.substring(0, 50) + '...');
  
  try {
    // Test 1: Session created notification
    console.log('\n1️⃣ Sending session created notification...');
    const sessionCreatedMessage = {
      text: '🍽️ New Order Session Created!',
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🍽️ New Order Session Created!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Restaurant:*\n${testSession.restaurant_name}`
            },
            {
              type: "mrkdwn",
              text: `*Session Time:*\n${new Date(testSession.start_time).toLocaleString()} - ${new Date(testSession.end_time).toLocaleString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Deadline:* ${new Date(testSession.end_time).toLocaleString()}\n\n*Time to order:* 5 minutes before deadline`
          }
        }
      ]
    };

    await sendSlackMessage(sessionCreatedMessage);
    console.log('✅ Session created notification sent!');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Deadline reminder notification
    console.log('\n2️⃣ Sending deadline reminder notification...');
    const deadlineReminderMessage = {
      text: '⏰ Order Deadline Reminder!',
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "⏰ Order Deadline Reminder!"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Restaurant:*\n${testSession.restaurant_name}`
            },
            {
              type: "mrkdwn",
              text: `*Deadline:*\n${new Date(testSession.end_time).toLocaleString()}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `⚠️ *Only 5 minutes left to place your order!*`
          }
        }
      ]
    };

    await sendSlackMessage(deadlineReminderMessage);
    console.log('✅ Deadline reminder notification sent!');
    
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Session ended notification
    console.log('\n3️⃣ Sending session ended notification...');
    const sessionEndedMessage = {
      text: '✅ Order Session Ended',
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "✅ Order Session Ended"
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `The order session for *${testSession.restaurant_name}* has ended. Thank you for participating!`
          }
        }
      ]
    };

    await sendSlackMessage(sessionEndedMessage);
    console.log('✅ Session ended notification sent!');
    
    console.log('\n🎉 All Slack notifications sent successfully!');
    console.log('📱 Check your Slack channel to see the messages.');
    
  } catch (error) {
    console.error('❌ Error testing Slack integration:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your webhook URL is correct');
    console.log('2. Check that the Slack app has permission to post to the channel');
    console.log('3. Verify the channel name in SLACK_CHANNEL environment variable');
  }
}

// Run the test
testSlackIntegration();
