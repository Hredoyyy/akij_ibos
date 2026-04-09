import { z } from 'zod/v4';

export const startAttemptSchema = z.object({
  examId: z.string().uuid('Invalid exam ID'),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('Invalid question ID'),
  selectedOptionIds: z.array(z.string().uuid()).default([]),
  textAnswer: z.string().nullable().default(null),
});

export const submitExamSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

export const reportViolationSchema = z.object({
  type: z.enum(['TAB_SWITCH', 'FULLSCREEN_EXIT', 'WINDOW_BLUR']),
});

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
export type ReportViolationInput = z.infer<typeof reportViolationSchema>;
