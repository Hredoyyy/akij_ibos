export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getExamCandidates } from '@/services/exam.service';
import { getUserByClerkId } from '@/services/user.service';

// GET /api/exams/[examId]/candidates — List candidates for an exam
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { examId } = await params;
    const candidates = await getExamCandidates(examId);
    return NextResponse.json(candidates);
  } catch (error) {
    console.error('[GET /api/exams/[examId]/candidates]', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}
