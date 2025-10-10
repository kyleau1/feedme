import { NextRequest, NextResponse } from 'next/server';
import { slackService } from '@/lib/slackService';

export async function POST(request: NextRequest) {
  try {
    // Test session data from the current active session
    const testSession = {
      id: 'bb6a506e-4b80-4097-89a5-ac48290f9816',
      restaurant_name: 'Lunch :)',
      restaurant_options: ['Chipotle'],
      start_time: '2025-09-29T02:39:00.000Z',
      end_time: '2025-09-29T02:46:00.000Z',
      doordash_group_link: 'https://doordash.com/group/dd_group_1759113570901_ks36cf6o8',
      created_by: 'user_327CzWfG6efxjVJwalq8huqdFNJ',
      company_id: '8169995a-0dfc-4306-9b12-498ed06bd931',
      status: 'active'
    };

    console.log('🧪 Testing deadline reminder notification...');
    console.log('📅 Session:', testSession.restaurant_name);
    console.log('🍽️ Restaurant:', testSession.restaurant_options[0]);
    console.log('⏰ End time:', testSession.end_time);

    const result = await slackService.sendDeadlineReminderNotification(testSession);
    
    return NextResponse.json({
      success: result,
      message: result ? 'Deadline reminder sent successfully!' : 'Failed to send deadline reminder',
      session: testSession
    });

  } catch (error) {
    console.error('Error testing deadline reminder:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Failed to test deadline reminder',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
