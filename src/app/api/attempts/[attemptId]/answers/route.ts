export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { saveAnswer } from '@/services/attempt.service';

// POST /api/attempts/[attemptId]/answers — Save/update an answer
export async function POST(
  req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await params;
    const { questionId, selectedOptionIds, textAnswer } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 });
    }

    const answer = await saveAnswer(
      attemptId,
      questionId,
      selectedOptionIds || [],
      textAnswer || null
    );

    return NextResponse.json(answer);
  } catch (error) {
    console.error('[POST /api/attempts/[attemptId]/answers]', error);
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 });
  }
}
