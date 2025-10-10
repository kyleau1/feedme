import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Health check requested');
    
    // Quick database connectivity test
    const { data, error } = await supabase
      .from('order_sessions')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database health check failed:', error);
      return NextResponse.json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: `${Date.now() - startTime}ms`
      }, { status: 200 }); // Still return 200 to prevent monitoring systems from alerting
    }
    
    // Check environment variables
    const envCheck = {
      slackWebhook: !!process.env.SLACK_WEBHOOK_URL,
      cronSecret: !!process.env.CRON_SECRET_TOKEN,
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      environment: envCheck,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      uptime: process.uptime ? `${Math.floor(process.uptime())}s` : 'unknown'
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    }, { status: 200 }); // Always return 200 for health checks
  }
}

// Allow POST for more comprehensive health checks
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🏥 Comprehensive health check requested');
    
    // Test database connectivity
    const dbStart = Date.now();
    const { data, error } = await supabase
      .from('order_sessions')
      .select('id, status')
      .limit(5);
    const dbDuration = Date.now() - dbStart;
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    // Test Slack webhook (if configured)
    let slackTest: { status: string; errorMessage?: string } = { status: 'not_configured' };
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        // Just validate the webhook URL format, don't actually send
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        slackTest = {
          status: webhookUrl.includes('hooks.slack.com') ? 'configured' : 'invalid_format'
        };
      } catch (error) {
        slackTest = { status: 'error', errorMessage: error instanceof Error ? error.message : 'Unknown' };
      }
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: {
          status: 'connected',
          duration: `${dbDuration}ms`,
          recordCount: data?.length || 0
        },
        slack: slackTest,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV,
          hasCronSecret: !!process.env.CRON_SECRET_TOKEN
        }
      },
      timestamp: new Date().toISOString(),
      totalDuration: `${duration}ms`
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Comprehensive health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    }, { status: 200 });
  }
}
