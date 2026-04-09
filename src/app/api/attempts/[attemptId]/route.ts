export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAttemptWithQuestions, submitExam } from '@/services/attempt.service';
import { getUserByClerkId } from '@/services/user.service';

// GET /api/attempts/[attemptId] — Get attempt details with questions
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const attempt = await getAttemptWithQuestions(attemptId);

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    return NextResponse.json(attempt);
  } catch (error) {
    console.error('[GET /api/attempts/[attemptId]]', error);
    return NextResponse.json({ error: 'Failed to fetch attempt' }, { status: 500 });
  }
}

// PUT /api/attempts/[attemptId] — Submit exam
export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { attemptId } = await params;
    const result = await submitExam(attemptId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit exam';
    console.error('[PUT /api/attempts/[attemptId]]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
