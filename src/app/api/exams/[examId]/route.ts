export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getExamById, deleteExam } from '@/services/exam.service';
import { getUserByClerkId } from '@/services/user.service';

// GET /api/exams/[examId] — Get single exam details
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { examId } = await params;
    const exam = await getExamById(examId);

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (error) {
    console.error('[GET /api/exams/[examId]]', error);
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
  }
}

// DELETE /api/exams/[examId] — Delete an exam
export async function DELETE(
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
    const exam = await getExamById(examId);

    if (!exam || exam.employerId !== user.id) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    await deleteExam(examId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/exams/[examId]]', error);
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 });
  }
}
