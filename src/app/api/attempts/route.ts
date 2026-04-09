export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserByClerkId } from '@/services/user.service';
import { startExamAttempt, getAttemptWithQuestions } from '@/services/attempt.service';
import { getAvailableExamsForCandidate } from '@/services/exam.service';

// GET /api/attempts — List available exams for candidate
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exams = await getAvailableExamsForCandidate(user.id);
    return NextResponse.json(exams);
  } catch (error) {
    console.error('[GET /api/attempts]', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST /api/attempts — Start a new exam attempt
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { examId, examSlotId } = await req.json();

    if (!examId || !examSlotId) {
      return NextResponse.json({ error: 'examId and examSlotId are required' }, { status: 400 });
    }

    const attempt = await startExamAttempt(user.id, examId, examSlotId);
    const fullAttempt = await getAttemptWithQuestions(attempt.id);
    return NextResponse.json(fullAttempt, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start attempt';
    console.error('[POST /api/attempts]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
