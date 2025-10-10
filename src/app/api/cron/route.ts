import { NextRequest, NextResponse } from 'next/server';
import { cronService } from '@/lib/cronService';

// Cold start detection
let isColdStart = true;
let coldStartTime = Date.now();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const isFirstRequest = isColdStart;
  
  try {
    // Cold start detection and logging
    if (isColdStart) {
      coldStartTime = startTime;
      isColdStart = false;
      console.log('🧊 Cold start detected - initializing cron service...');
    }
    
    console.log('🚀 Cron API called via POST', isFirstRequest ? '(cold start)' : '(warm)');
    
    // Optional: Add authentication/authorization for cron endpoint
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.log('❌ Unauthorized cron request');
      // Still return 200 to prevent cron disabling
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing authorization token'
      }, { status: 200 });
    }

    console.log('✅ Starting cron jobs...');
    
    // Add timeout protection for the entire cron job execution
    // Reduced timeout to 50s to leave buffer for Vercel's 60s limit
    const cronPromise = cronService.runAllCronJobs();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Cron job timeout after 50 seconds')), 50000)
    );
    
    await Promise.race([cronPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cron jobs completed successfully in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron jobs completed successfully',
      duration: `${duration}ms`,
      coldStart: isFirstRequest
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error running cron jobs after ${duration}ms:`, error);
    
    // Always return 200 OK to prevent external cron services from disabling the job
    // Log the error but don't fail the request
    return NextResponse.json({ 
      success: false,
      error: 'Cron jobs encountered errors but completed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      coldStart: isFirstRequest,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}

// Allow GET for testing purposes
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const isFirstRequest = isColdStart;
  
  try {
    // Cold start detection and logging
    if (isColdStart) {
      coldStartTime = startTime;
      isColdStart = false;
      console.log('🧊 Cold start detected - initializing cron service...');
    }
    
    console.log('🧪 Cron API called via GET (testing)', isFirstRequest ? '(cold start)' : '(warm)');
    
    // Add timeout protection for testing as well
    const cronPromise = cronService.runAllCronJobs();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Test cron job timeout after 50 seconds')), 50000)
    );
    
    await Promise.race([cronPromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Test cron jobs completed in ${duration}ms`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cron jobs completed successfully',
      duration: `${duration}ms`,
      coldStart: isFirstRequest
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Error running test cron jobs after ${duration}ms:`, error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Cron jobs encountered errors but completed',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`,
      coldStart: isFirstRequest,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}
