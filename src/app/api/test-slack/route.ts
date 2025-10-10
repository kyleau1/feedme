import { NextRequest, NextResponse } from 'next/server';
import { slackService } from '@/lib/slackService';

export async function GET(request: NextRequest) {
  try {
    // Test data
    const testSession = {
      id: 'test-session-123',
      restaurant_name: 'Test Session',
      restaurant_options: ['McDonald\'s'],
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      doordash_group_link: 'https://example.com/test-link',
      created_by: 'test-user',
      company_id: 'test-company',
      status: 'active'
    };

    const results = {
      sessionCreated: false,
      deadlineReminder: false,
      sessionEnded: false,
      errors: [] as string[]
    };

    // Test session created notification
    try {
      results.sessionCreated = await slackService.sendSessionCreatedNotification(testSession);
    } catch (error) {
      results.errors.push(`Session created: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test deadline reminder notification
    try {
      results.deadlineReminder = await slackService.sendDeadlineReminderNotification(testSession);
    } catch (error) {
      results.errors.push(`Deadline reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test session ended notification
    try {
      results.sessionEnded = await slackService.sendSessionEndedNotification(testSession);
    } catch (error) {
      results.errors.push(`Session ended: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const allSuccessful = results.sessionCreated && results.deadlineReminder && results.sessionEnded;
    const hasErrors = results.errors.length > 0;

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful 
        ? 'All Slack notifications sent successfully! Check your Slack channel.' 
        : hasErrors 
          ? 'Some notifications failed. Check the errors below.'
          : 'Slack webhook URL not configured.',
      results,
      webhookConfigured: !!process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#general'
    });

  } catch (error) {
    console.error('Error testing Slack integration:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to test Slack integration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
