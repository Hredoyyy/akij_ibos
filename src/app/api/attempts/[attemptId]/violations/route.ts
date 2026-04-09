export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { recordViolation } from '@/services/attempt.service';

// POST /api/attempts/[attemptId]/violations — Report a behavioral violation
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const attempt = await recordViolation(attemptId);

    return NextResponse.json({
      violations: attempt.violations,
      status: attempt.status,
      terminated: attempt.status === 'VIOLATION_TERMINATED',
    });
  } catch (error) {
    console.error('[POST /api/attempts/[attemptId]/violations]', error);
    return NextResponse.json({ error: 'Failed to record violation' }, { status: 500 });
  }
}
