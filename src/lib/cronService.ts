import { supabase } from './supabaseClient';
import { slackService } from './slackService';

interface OrderSession {
  id: string;
  restaurant_name: string;
  start_time: string;
  end_time: string;
  doordash_group_link?: string;
  created_by: string;
  company_id: string;
  status: string;
}

export class CronService {
  // Add timeout and error handling improvements
  private readonly TIMEOUT_MS = 30000; // 30 second timeout
  private readonly MAX_SESSIONS_PER_BATCH = 10; // Limit processing to prevent overload

  async checkAndSendDeadlineReminders(): Promise<void> {
    const startTime = Date.now();
    try {
      console.log('🔍 Starting deadline reminder check...');
      
      const now = new Date();
      const fourMinutesFromNow = new Date(now.getTime() + 4 * 60 * 1000);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      console.log(`Current time: ${now.toISOString()}`);
      console.log(`Looking for sessions ending between: ${fourMinutesFromNow.toISOString()} and ${fiveMinutesFromNow.toISOString()}`);
      
      // Find sessions that end in exactly 4-5 minutes (tight window for 5-minute reminders)
      const { data: sessions, error } = await supabase
        .from('order_sessions')
        .select('*')
        .eq('status', 'active')
        .gte('end_time', fourMinutesFromNow.toISOString())
        .lte('end_time', fiveMinutesFromNow.toISOString())
        .limit(this.MAX_SESSIONS_PER_BATCH); // Limit to prevent overload

      if (error) {
        console.error('Error fetching sessions for deadline reminders:', error);
        return;
      }

      console.log(`Found ${sessions?.length || 0} sessions needing reminders`);

      if (!sessions || sessions.length === 0) {
        console.log('No sessions need deadline reminders at this time');
        return;
      }

      // Send reminders for each session with timeout protection
      let successCount = 0;
      let errorCount = 0;
      
      for (const session of sessions) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > this.TIMEOUT_MS) {
          console.warn('⚠️ Approaching timeout, stopping reminder processing');
          break;
        }
        
        console.log(`Sending deadline reminder for session ${session.id} (${session.restaurant_name})`);
        
        try {
          await Promise.race([
            slackService.sendDeadlineReminderNotification(session),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Slack notification timeout')), 10000)
            )
          ]);
          
          console.log(`✅ Deadline reminder sent for session ${session.id}`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Failed to send deadline reminder for session ${session.id}:`, error);
          errorCount++;
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Deadline reminders completed: ${successCount} sent, ${errorCount} failed`);
    } catch (error) {
      console.error('Error in deadline reminder cron job:', error);
      // Don't re-throw - let the main handler deal with it gracefully
      console.error('Deadline reminder error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }

  async checkAndEndExpiredSessions(): Promise<void> {
    const startTime = Date.now();
    try {
      console.log('🔍 Starting expired session check...');
      
      const now = new Date();
      
      // Find sessions that have ended but are still marked as active
      const { data: sessions, error } = await supabase
        .from('order_sessions')
        .select('*')
        .eq('status', 'active')
        .lt('end_time', now.toISOString())
        .limit(this.MAX_SESSIONS_PER_BATCH); // Limit to prevent overload

      console.log(`Checking for expired sessions. Current time: ${now.toISOString()}`);
      console.log(`Found ${sessions?.length || 0} expired sessions`);

      if (error) {
        console.error('Error fetching expired sessions:', error);
        return;
      }

      if (!sessions || sessions.length === 0) {
        console.log('No expired sessions to end');
        return;
      }

      // Update sessions to ended status and send notifications
      let successCount = 0;
      let errorCount = 0;
      
      for (const session of sessions) {
        // Check if we're approaching timeout
        if (Date.now() - startTime > this.TIMEOUT_MS) {
          console.warn('⚠️ Approaching timeout, stopping session processing');
          break;
        }
        
        console.log(`Ending expired session ${session.id} (${session.restaurant_name})`);
        
        // Update session status to 'completed' (since 'ended' might not be allowed)
        const { error: updateError } = await supabase
          .from('order_sessions')
          .update({ status: 'completed' })
          .eq('id', session.id);

        if (updateError) {
          console.error(`Error updating session ${session.id}:`, updateError);
          errorCount++;
          continue;
        }

        console.log(`✅ Session ${session.id} marked as ended`);
        successCount++;

        // Send end notification with timeout protection
        try {
          await Promise.race([
            slackService.sendSessionEndedNotification(session),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Slack notification timeout')), 10000)
            )
          ]);
          
          console.log(`✅ End notification sent for session ${session.id}`);
        } catch (error) {
          console.error(`❌ Failed to send end notification for session ${session.id}:`, error);
          // Don't increment error count for notification failures
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Expired session processing completed: ${successCount} processed, ${errorCount} failed`);
    } catch (error) {
      console.error('Error in session end cron job:', error);
      // Don't re-throw - let the main handler deal with it gracefully
      console.error('Session end error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }

  async runAllCronJobs(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting cron jobs...');
    
    try {
      // Run jobs sequentially to avoid overwhelming the system
      // and to ensure proper error handling
      console.log('📅 Running deadline reminder check...');
      await this.checkAndSendDeadlineReminders();
      
      console.log('⏰ Running expired session check...');
      await this.checkAndEndExpiredSessions();
      
      const duration = Date.now() - startTime;
      console.log(`✅ All cron jobs completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Cron jobs failed after ${duration}ms:`, error);
      
      // Don't re-throw the error to prevent 503 responses
      // Instead, log it and continue - this prevents external cron services
      // from disabling the job due to repeated failures
      console.error('Cron job error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`
      });
      
      // Ensure we never throw unhandled promise rejections
      // This is critical for preventing Vercel from disabling the cron job
      return Promise.resolve();
    }
  }
}

export const cronService = new CronService();
