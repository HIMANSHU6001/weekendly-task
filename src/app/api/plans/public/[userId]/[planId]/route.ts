import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; planId: string }> }
) {
  try {
    const { userId, planId } = await params;

    if (!userId || !planId) {
      return NextResponse.json({ error: 'User ID and Plan ID are required' }, { status: 400 });
    }

    // Query the specific user's plan directly
    const planDoc = await adminDb
      .collection('users')
      .doc(userId)
      .collection('plans')
      .doc(planId)
      .get();

    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const planData = planDoc.data();

    // Return the plan data
    return NextResponse.json({ id: planDoc.id, ...planData });
  } catch (error) {
    console.error('Error fetching public plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan. Please check if the plan exists and is publicly accessible.' },
      { status: 500 }
    );
  }
}
