'use client';

import { create } from 'zustand';
import type { QuestionType } from '@prisma/client';

export interface DraftOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface DraftQuestion {
  id: string;
  title: string;
  type: QuestionType;
  points: number;
  order: number;
  options: DraftOption[];
}

export interface DraftQuestionSet {
  name: string;
  questions: DraftQuestion[];
}

export interface DraftSlot {
  slotNumber: number;
  startTime: string;
  endTime: string;
  questionSet: DraftQuestionSet;
}

interface CreateExamState {
  // Step tracking
  currentStep: number;

  // Step 1: Basic Info
  title: string;
  totalCandidates: number;
  totalSlots: number;
  duration: number;
  negativeMarking: boolean;

  // Step 2: Slots & Question Sets
  slots: DraftSlot[];

  // Actions
  setStep: (step: number) => void;
  setBasicInfo: (info: Partial<Pick<CreateExamState, 'title' | 'totalCandidates' | 'totalSlots' | 'duration' | 'negativeMarking'>>) => void;
  initializeSlots: (count: number) => void;
  updateSlotTime: (slotNumber: number, field: 'startTime' | 'endTime', value: string) => void;
  addQuestion: (slotNumber: number, question: DraftQuestion) => void;
  updateQuestion: (slotNumber: number, questionId: string, question: DraftQuestion) => void;
  removeQuestion: (slotNumber: number, questionId: string) => void;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const createDefaultOptions = (): DraftOption[] => [
  { id: generateId(), text: '', isCorrect: false },
  { id: generateId(), text: '', isCorrect: false },
  { id: generateId(), text: '', isCorrect: false },
  { id: generateId(), text: '', isCorrect: false },
];

const getSetLabel = (index: number): string => {
  return `Set ${String.fromCharCode(65 + index)}`; // Set A, Set B, etc.
};

const initialState = {
  currentStep: 1,
  title: '',
  totalCandidates: 1,
  totalSlots: 1,
  duration: 60,
  negativeMarking: false,
  slots: [],
};

export const useCreateExamStore = create<CreateExamState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setBasicInfo: (info) => set(info),

  initializeSlots: (count) => {
    const existing = get().slots;
    const slots: DraftSlot[] = [];

    for (let i = 0; i < count; i++) {
      if (existing[i]) {
        slots.push(existing[i]);
      } else {
        slots.push({
          slotNumber: i + 1,
          startTime: '',
          endTime: '',
          questionSet: {
            name: getSetLabel(i),
            questions: [],
          },
        });
      }
    }

    set({ slots });
  },

  updateSlotTime: (slotNumber, field, value) => {
    set((state) => ({
      slots: state.slots.map((slot) =>
        slot.slotNumber === slotNumber ? { ...slot, [field]: value } : slot
      ),
    }));
  },

  addQuestion: (slotNumber, question) => {
    set((state) => ({
      slots: state.slots.map((slot) =>
        slot.slotNumber === slotNumber
          ? {
              ...slot,
              questionSet: {
                ...slot.questionSet,
                questions: [...slot.questionSet.questions, question],
              },
            }
          : slot
      ),
    }));
  },

  updateQuestion: (slotNumber, questionId, question) => {
    set((state) => ({
      slots: state.slots.map((slot) =>
        slot.slotNumber === slotNumber
          ? {
              ...slot,
              questionSet: {
                ...slot.questionSet,
                questions: slot.questionSet.questions.map((q) =>
                  q.id === questionId ? question : q
                ),
              },
            }
          : slot
      ),
    }));
  },

  removeQuestion: (slotNumber, questionId) => {
    set((state) => ({
      slots: state.slots.map((slot) =>
        slot.slotNumber === slotNumber
          ? {
              ...slot,
              questionSet: {
                ...slot.questionSet,
                questions: slot.questionSet.questions.filter((q) => q.id !== questionId),
              },
            }
          : slot
      ),
    }));
  },

  reset: () => set(initialState),
}));

// Helper to create a new question draft
export function createNewQuestion(order: number): DraftQuestion {
  return {
    id: generateId(),
    title: '',
    type: 'RADIO',
    points: 1,
    order,
    options: createDefaultOptions(),
  };
}

// Helper to add a new option
export function createNewOption(): DraftOption {
  return { id: generateId(), text: '', isCorrect: false };
}
