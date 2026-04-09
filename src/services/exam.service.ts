import { prisma } from '@/lib/prisma';
import type { CreateExamInput } from '@/types/exam';

export async function getExamsByEmployer(employerId: string) {
  return prisma.exam.findMany({
    where: { employerId },
    include: {
      slots: {
        include: {
          questionSet: {
            include: {
              _count: { select: { questions: true } },
            },
          },
        },
        orderBy: { slotNumber: 'asc' },
      },
      _count: { select: { attempts: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getExamById(examId: string) {
  return prisma.exam.findUnique({
    where: { id: examId },
    include: {
      slots: {
        include: {
          questionSet: {
            include: {
              questions: {
                include: { options: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
        orderBy: { slotNumber: 'asc' },
      },
      _count: { select: { attempts: true } },
    },
  });
}

export async function createExam(employerId: string, input: CreateExamInput) {
  return prisma.$transaction(async (tx) => {
    // Create the exam
    const exam = await tx.exam.create({
      data: {
        title: input.title,
        totalCandidates: input.totalCandidates,
        totalSlots: input.totalSlots,
        duration: input.duration,
        negativeMarking: input.negativeMarking,
        employerId,
      },
    });

    // Create slots with question sets and questions
    for (const slotInput of input.slots) {
      const slot = await tx.examSlot.create({
        data: {
          examId: exam.id,
          slotNumber: slotInput.slotNumber,
          startTime: new Date(slotInput.startTime),
          endTime: new Date(slotInput.endTime),
        },
      });

      const questionSet = await tx.questionSet.create({
        data: {
          examSlotId: slot.id,
          name: slotInput.questionSet.name,
        },
      });

      for (const questionInput of slotInput.questionSet.questions) {
        const question = await tx.question.create({
          data: {
            questionSetId: questionSet.id,
            title: questionInput.title,
            type: questionInput.type,
            points: questionInput.points,
            order: questionInput.order,
          },
        });

        if (questionInput.options.length > 0) {
          await tx.option.createMany({
            data: questionInput.options.map((opt) => ({
              questionId: question.id,
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
          });
        }
      }
    }

    return getExamById(exam.id);
  });
}

export async function deleteExam(examId: string) {
  return prisma.exam.delete({ where: { id: examId } });
}

export async function getAvailableExamsForCandidate(candidateId: string) {
  const now = new Date();

  const exams = await prisma.exam.findMany({
    where: {
      slots: {
        some: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
      },
    },
    include: {
      slots: {
        where: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
        include: {
          questionSet: {
            include: {
              _count: { select: { questions: true } },
            },
          },
        },
      },
      attempts: {
        where: { candidateId },
        select: { id: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  return exams.map((exam) => ({
    id: exam.id,
    title: exam.title,
    duration: exam.duration,
    negativeMarking: exam.negativeMarking,
    totalQuestions: exam.slots[0]?.questionSet?._count?.questions || 0,
    activeSlot: exam.slots[0]
      ? {
          id: exam.slots[0].id,
          slotNumber: exam.slots[0].slotNumber,
          startTime: exam.slots[0].startTime,
          endTime: exam.slots[0].endTime,
        }
      : null,
    hasAttempted: exam.attempts.length > 0,
    totalCandidates: exam.totalCandidates,
    currentCandidates: exam._count.attempts,
  }));
}

export async function getExamCandidates(examId: string) {
  return prisma.examAttempt.findMany({
    where: { examId },
    include: {
      candidate: {
        select: { id: true, name: true, email: true },
      },
      examSlot: {
        select: { slotNumber: true, startTime: true },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
}
