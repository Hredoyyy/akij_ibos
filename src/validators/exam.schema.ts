import { z } from 'zod/v4';

// ─── Option Schema ─────────────────────────────────

export const optionSchema = z.object({
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
});

// ─── Question Schema ───────────────────────────────

export const questionSchema = z.object({
  title: z.string().min(1, 'Question title is required'),
  type: z.enum(['RADIO', 'CHECKBOX', 'TEXT']),
  points: z.number().min(0.25, 'Points must be at least 0.25').default(1),
  order: z.number().int().min(0).default(0),
  options: z.array(optionSchema).default([]),
}).refine(
  (data) => {
    // Text questions don't need options
    if (data.type === 'TEXT') return true;
    // MCQ questions need at least 2 options
    return data.options.length >= 2;
  },
  { message: 'MCQ questions require at least 2 options' }
).refine(
  (data) => {
    if (data.type === 'TEXT') return true;
    // At least one correct answer required for MCQ
    return data.options.some((o) => o.isCorrect);
  },
  { message: 'At least one correct answer is required' }
);

// ─── Question Set Schema ───────────────────────────

export const questionSetSchema = z.object({
  name: z.string().min(1, 'Set name is required'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

// ─── Exam Slot Schema ──────────────────────────────

export const examSlotSchema = z.object({
  slotNumber: z.number().int().min(1),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  questionSet: questionSetSchema,
}).refine(
  (data) => new Date(data.startTime) < new Date(data.endTime),
  { message: 'Start time must be before end time' }
);

// ─── Create Exam Schema ────────────────────────────

export const createExamSchema = z.object({
  title: z.string().min(1, 'Exam title is required').max(200),
  totalCandidates: z.number().int().min(1, 'At least 1 candidate required'),
  totalSlots: z.number().int().min(1, 'At least 1 slot required'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  negativeMarking: z.boolean().default(false),
  slots: z.array(examSlotSchema).min(1, 'At least one slot is required'),
}).refine(
  (data) => data.slots.length === data.totalSlots,
  { message: 'Number of slots must match totalSlots' }
);

// ─── Basic Info Step Schema (for multi-step form) ──

export const basicInfoSchema = z.object({
  title: z.string().min(1, 'Exam title is required').max(200),
  totalCandidates: z.number().int().min(1, 'At least 1 candidate required'),
  totalSlots: z.number().int().min(1, 'At least 1 slot required').max(10, 'Maximum 10 slots'),
  duration: z.number().int().min(1, 'Duration must be at least 1 minute'),
  negativeMarking: z.boolean().default(false),
});

export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type CreateExamFormData = z.infer<typeof createExamSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type OptionFormData = z.infer<typeof optionSchema>;
