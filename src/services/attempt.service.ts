import { prisma } from '@/lib/prisma';

export async function startExamAttempt(
  candidateId: string,
  examId: string,
  examSlotId: string
) {
  // Check if candidate already has an attempt for this exam
  const existing = await prisma.examAttempt.findUnique({
    where: {
      candidateId_examId: { candidateId, examId },
    },
  });

  if (existing) {
    return existing;
  }

  // Check if slot is still within time window
  const slot = await prisma.examSlot.findUnique({
    where: { id: examSlotId },
  });

  if (!slot) {
    throw new Error('Exam slot not found');
  }

  const now = new Date();
  if (now < slot.startTime || now > slot.endTime) {
    throw new Error('Exam slot is not currently active');
  }

  // Check candidate capacity
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { _count: { select: { attempts: true } } },
  });

  if (!exam) {
    throw new Error('Exam not found');
  }

  if (exam._count.attempts >= exam.totalCandidates) {
    throw new Error('Exam is full — all candidate slots are taken');
  }

  return prisma.examAttempt.create({
    data: {
      candidateId,
      examId,
      examSlotId,
    },
  });
}

export async function getAttemptWithQuestions(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: true,
      examSlot: {
        include: {
          questionSet: {
            include: {
              questions: {
                include: { options: { select: { id: true, text: true } } },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
      answers: true,
    },
  });

  return attempt;
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
  textAnswer: string | null
) {
  return prisma.answer.upsert({
    where: {
      attemptId_questionId: { attemptId, questionId },
    },
    update: {
      selectedOptionIds,
      textAnswer,
    },
    create: {
      attemptId,
      questionId,
      selectedOptionIds,
      textAnswer,
    },
  });
}

export async function submitExam(attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: true,
      answers: true,
      examSlot: {
        include: {
          questionSet: {
            include: {
              questions: {
                include: { options: true },
              },
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    throw new Error('Attempt not found');
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error('Exam already submitted');
  }

  // Calculate score
  const questions = attempt.examSlot.questionSet?.questions || [];
  let score = 0;

  for (const question of questions) {
    const answer = attempt.answers.find((a) => a.questionId === question.id);

    if (!answer || question.type === 'TEXT') {
      continue; // Text answers need manual review, skip scoring
    }

    const correctOptionIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id)
      .sort();

    const selectedIds = [...answer.selectedOptionIds].sort();

    const isCorrect =
      correctOptionIds.length === selectedIds.length &&
      correctOptionIds.every((id, i) => id === selectedIds[i]);

    if (isCorrect) {
      score += question.points;
    } else if (answer.selectedOptionIds.length > 0 && attempt.exam.negativeMarking) {
      // Negative marking: -0.25 × question points for wrong answer
      score -= 0.25 * question.points;
    }
  }

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      score: Math.max(0, score), // Don't go below 0
    },
  });
}

export async function recordViolation(attemptId: string) {
  const attempt = await prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      violations: { increment: 1 },
    },
  });

  // Auto-terminate after 3 violations
  if (attempt.violations >= 3) {
    return prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'VIOLATION_TERMINATED',
        submittedAt: new Date(),
      },
    });
  }

  return attempt;
}

export async function autoSubmitTimedOut(attemptId: string) {
  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: 'TIMED_OUT',
      submittedAt: new Date(),
    },
  });
}
