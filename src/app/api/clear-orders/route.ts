import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function DELETE() {
  try {
    // Clear all orders from the database
    const { error } = await supabase
      .from('orders')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('Error clearing orders:', error);
      return NextResponse.json({ error: 'Failed to clear orders' }, { status: 500 });
    }

    return NextResponse.json({ message: 'All orders cleared successfully' });
  } catch (error) {
    console.error('Error clearing orders:', error);
    return NextResponse.json({ error: 'Failed to clear orders' }, { status: 500 });
  }
}
