interface SlackMessage {
  text: string;
  blocks?: any[];
  attachments?: any[];
}

interface OrderSession {
  id: string;
  restaurant_name: string;
  restaurant_options?: string[];
  start_time: string;
  end_time: string;
  doordash_group_link?: string;
  created_by: string;
  company_id: string;
  status: string;
}

export class SlackService {
  private webhookUrl: string;
  private channel: string;

  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
    this.channel = '#feed-me-task-tracker'; // Hardcoded to ensure correct channel - UPDATED
    
    console.log('🔧 Slack Service Configuration:');
    console.log('📤 Webhook URL:', this.webhookUrl ? 'Set' : 'Not set');
    console.log('📢 Channel:', this.channel);
    console.log('🔍 Raw SLACK_CHANNEL:', process.env.SLACK_CHANNEL);
  }

  private async sendMessage(message: SlackMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured');
      return false;
    }

    console.log('📤 Sending Slack message to:', this.channel);
    console.log('📤 Webhook URL:', this.webhookUrl.substring(0, 50) + '...');

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: this.channel,
          ...message,
        }),
      });

      console.log('📤 Slack response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send Slack message:', response.status, response.statusText, errorText);
        return false;
      }

      console.log('✅ Slack message sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending Slack message:', error);
      return false;
    }
  }

  async sendSessionCreatedNotification(session: OrderSession): Promise<boolean> {
    const startTime = new Date(session.start_time).toLocaleString();
    const endTime = new Date(session.end_time).toLocaleString();
    
    // Use restaurant_options if available, otherwise use restaurant_name
    const restaurantName = Array.isArray(session.restaurant_options) && session.restaurant_options.length > 0
      ? session.restaurant_options[0]
      : session.restaurant_name;
    
    const message: SlackMessage = {
      text: `🍽️ New Order Session Created!`,
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
              text: `*Restaurant:*\n${restaurantName}`
            },
            {
              type: "mrkdwn",
              text: `*Session Time:*\n${startTime} - ${endTime}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Deadline:* ${endTime}`
          }
        }
      ]
    };

    if (session.doordash_group_link) {
      message.blocks?.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Join Order Session"
            },
            url: session.doordash_group_link,
            style: "primary"
          }
        ]
      });
    }

    return await this.sendMessage(message);
  }

  async sendDeadlineReminderNotification(session: OrderSession): Promise<boolean> {
    const endTime = new Date(session.end_time).toLocaleString();
    
    // Use restaurant_options if available, otherwise use restaurant_name
    const restaurantName = Array.isArray(session.restaurant_options) && session.restaurant_options.length > 0
      ? session.restaurant_options[0]
      : session.restaurant_name;
    
    const message: SlackMessage = {
      text: `⏰ Order Deadline Reminder!`,
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
              text: `*Restaurant:*\n${restaurantName}`
            },
            {
              type: "mrkdwn",
              text: `*Deadline:*\n${endTime}`
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

    if (session.doordash_group_link) {
      message.blocks?.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Place Order Now"
            },
            url: session.doordash_group_link,
            style: "danger"
          }
        ]
      });
    }

    return await this.sendMessage(message);
  }

  async sendSessionEndedNotification(session: OrderSession): Promise<boolean> {
    const message: SlackMessage = {
      text: `✅ Order Session Ended`,
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
            text: `The order session for *${session.restaurant_name}* has ended. Thank you for participating!`
          }
        }
      ]
    };

    return await this.sendMessage(message);
  }
}

export const slackService = new SlackService();
