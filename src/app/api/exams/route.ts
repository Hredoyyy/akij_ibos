export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getExamsByEmployer, createExam } from '@/services/exam.service';
import { getUserByClerkId } from '@/services/user.service';
import { createExamSchema } from '@/validators/exam.schema';

// GET /api/exams — List exams for the logged-in employer
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const exams = await getExamsByEmployer(user.id);
    return NextResponse.json(exams);
  } catch (error) {
    console.error('[GET /api/exams]', error);
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
  }
}

// POST /api/exams — Create a new exam
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserByClerkId(userId);
    if (!user || user.role !== 'EMPLOYER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const result = createExamSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.issues },
        { status: 400 }
      );
    }

    const exam = await createExam(user.id, result.data);
    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('[POST /api/exams]', error);
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
  }
}
