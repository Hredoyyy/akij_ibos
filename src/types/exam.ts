import type { QuestionType, AttemptStatus } from '@prisma/client';

// ─── Exam Types ────────────────────────────────────

export interface ExamWithSlots {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
  negativeMarking: boolean;
  employerId: string;
  createdAt: Date;
  updatedAt: Date;
  slots: ExamSlotWithSet[];
  _count?: {
    attempts: number;
  };
}

export interface ExamSlotWithSet {
  id: string;
  examId: string;
  slotNumber: number;
  startTime: Date;
  endTime: Date;
  questionSet: QuestionSetWithQuestions | null;
}

export interface QuestionSetWithQuestions {
  id: string;
  examSlotId: string;
  name: string;
  questions: QuestionWithOptions[];
}

export interface QuestionWithOptions {
  id: string;
  questionSetId: string;
  title: string;
  type: QuestionType;
  points: number;
  order: number;
  options: OptionData[];
}

export interface OptionData {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
}

// ─── Candidate Exam View ───────────────────────────

export interface CandidateExamView {
  id: string;
  title: string;
  duration: number;
  negativeMarking: boolean;
  totalQuestions: number;
  activeSlot: {
    id: string;
    slotNumber: number;
    startTime: Date;
    endTime: Date;
  } | null;
  hasAttempted: boolean;
}

// ─── Attempt Types ─────────────────────────────────

export interface AttemptWithAnswers {
  id: string;
  candidateId: string;
  examId: string;
  examSlotId: string;
  startedAt: Date;
  submittedAt: Date | null;
  score: number | null;
  violations: number;
  status: AttemptStatus;
  answers: AnswerData[];
}

export interface AnswerData {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
}

// ─── Create Exam Types ─────────────────────────────

export interface CreateExamSlotInput {
  slotNumber: number;
  startTime: string;
  endTime: string;
  questionSet: {
    name: string;
    questions: CreateQuestionInput[];
  };
}

export interface CreateQuestionInput {
  title: string;
  type: QuestionType;
  points: number;
  order: number;
  options: CreateOptionInput[];
}

export interface CreateOptionInput {
  text: string;
  isCorrect: boolean;
}

export interface CreateExamInput {
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
  negativeMarking: boolean;
  slots: CreateExamSlotInput[];
}
