'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { ShieldAlert, LogOut, Clock, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExamTimer } from '@/hooks/useExamTimer';
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'VIOLATION_TERMINATED';

interface AttemptOption {
  id: string;
  text: string;
}

interface AttemptQuestion {
  id: string;
  title: string;
  type: 'CHECKBOX' | 'RADIO' | 'TEXT';
  points: number;
  options: AttemptOption[];
}

interface AttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
  textAnswer: string | null;
}

interface AttemptResponse {
  id: string;
  status: AttemptStatus;
  startedAt: string;
  violations: number;
  exam: {
    title: string;
    duration: number;
  };
  examSlot: {
    questionSet: {
      questions: AttemptQuestion[];
    } | null;
  };
  answers: AttemptAnswer[];
}

interface ViolationResponse {
  terminated: boolean;
  violations: number;
}

export default function ExamTakingInterface() {
  const router = useRouter();
  const { attemptId } = useParams();

  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds: string[]; textAnswer: string | null }>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  // 1. Fetch Attempt Data
  const { data: attempt, isLoading, refetch } = useQuery<AttemptResponse>({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/attempts/${attemptId}`);
      return data;
    },
    refetchOnWindowFocus: false, // Don't refetch on focus, as focus changes are tracked
  });

  const persistedAnswers = useMemo(() => {
    const initial: Record<string, { selectedOptionIds: string[]; textAnswer: string | null }> = {};

    for (const ans of attempt?.answers ?? []) {
      initial[ans.questionId] = {
        selectedOptionIds: ans.selectedOptionIds,
        textAnswer: ans.textAnswer,
      };
    }

    return initial;
  }, [attempt?.answers]);

  const mergedAnswers = useMemo(
    () => ({ ...persistedAnswers, ...answers }),
    [persistedAnswers, answers]
  );

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.put(`/api/attempts/${attemptId}`);
      return data;
    },
    onSuccess: () => {
      toast.success('Exam submitted successfully!');
      router.replace('/candidate/dashboard');
    },
    onError: () => {
      toast.error('Failed to submit exam, please try again when online.');
    }
  });

  const handleAutoSubmit = useCallback(() => {
    submitMutation.mutate();
  }, [submitMutation]);

  // 2. Offline Sync Hook
  const { isOnline, pendingCount, queueAnswer } = useOfflineSync({
    attemptId: attemptId as string,
    enabled: attempt?.status === 'IN_PROGRESS',
  });

  // 3. Timer Hook
  const { formattedTime, isWarning, isCritical } = useExamTimer({
    durationMinutes: attempt?.exam.duration || 60,
    startedAt: attempt?.startedAt || new Date(),
    onTimeout: handleAutoSubmit,
    enabled: attempt?.status === 'IN_PROGRESS',
  });

  // 4. Behavior Tracking Hook
  const recordViolationMutation = useMutation<ViolationResponse>({
    mutationFn: async () => {
      const { data } = await axios.post(`/api/attempts/${attemptId}/violations`);
      return data;
    },
    onSuccess: (data) => {
      if (data.terminated) {
        toast.error('Exam forcefully terminated due to integrity violations.', { duration: 10000 });
        router.replace('/candidate/dashboard');
      } else {
        toast.warning(`Integrity Warning! You have ${data.violations}/3 violations. Further violations will terminate the exam.`, { duration: 8000 });
        // Force refresh to update violations UI
        refetch();
      }
    }
  });

  const { enterFullscreen, isFullscreen } = useBehaviorTracking({
    onViolation: () => {
      if (attempt?.status === 'IN_PROGRESS') {
        recordViolationMutation.mutate();
      }
    },
    enabled: attempt?.status === 'IN_PROGRESS',
  });

  // Save answer locally and queue for sync
  const handleAnswerUpdate = (questionId: string, updates: { selectedOptionIds: string[]; textAnswer: string | null }) => {
    setAnswers((prev) => ({ ...prev, [questionId]: updates }));
    queueAnswer({ questionId, ...updates });
  };

  // Toggle option for Radio/Checkbox
  const handleToggleOption = (questionId: string, type: 'CHECKBOX' | 'RADIO' | 'TEXT', optionId: string) => {
    const current = mergedAnswers[questionId]?.selectedOptionIds || [];
    let next: string[];

    if (type === 'RADIO') {
      next = [optionId];
    } else {
      // CHECKBOX
      if (current.includes(optionId)) {
        next = current.filter((id) => id !== optionId);
      } else {
        next = [...current, optionId];
      }
    }

    handleAnswerUpdate(questionId, { selectedOptionIds: next, textAnswer: mergedAnswers[questionId]?.textAnswer || null });
  };

  if (isLoading || !attempt) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6633FF] border-t-transparent animate-spin mb-4" />
        <p className="text-[#64748B] animate-pulse">Initializing secure exam environment...</p>
      </div>
    );
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#D1D5DB] max-w-md w-full">
           <h2 className="text-2xl font-bold text-[#334155] mb-2">Exam Completed</h2>
           <p className="text-[#64748B] mb-6">This attempt has already been submitted or terminated.</p>
           <Button onClick={() => router.replace('/candidate/dashboard')} className="w-full btn-primary">
             Return to Dashboard
           </Button>
        </div>
      </div>
    );
  }

  const questions = attempt.examSlot.questionSet?.questions ?? [];
  const currentQuestion = questions[currentQuestionIdx];

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#D1D5DB] max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#334155] mb-2">No Questions Found</h2>
          <p className="text-[#64748B] mb-6">This exam slot has no questions configured.</p>
          <Button onClick={() => router.replace('/candidate/dashboard')} className="w-full btn-primary">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col select-none">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#D1D5DB] h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="font-bold text-[#334155] text-lg hidden sm:block">{attempt.exam.title}</div>
           
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#F1F5F9]">
              {isOnline ? (
                <><Wifi className="w-4 h-4 text-[#22C55E]" /> <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider hidden sm:inline">Online</span></>
              ) : (
                <><WifiOff className="w-4 h-4 text-[#EF4444]" /> <span className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider">Offline</span></>
              )}
              {pendingCount > 0 && (
                <span className="text-xs bg-[#64748B] text-white px-2 py-0.5 rounded-full ml-2">
                  {pendingCount} unsynced
                </span>
              )}
           </div>
        </div>

        <div className="flex items-center gap-6">
           {/* Violations Warning */}
           {attempt.violations > 0 && (
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#EF4444] bg-[#FEF2F2] px-3 py-1.5 rounded-lg border border-[#FEE2E2] animate-pulse">
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Violations: </span>{attempt.violations}/3
              </div>
           )}

           {/* Timer */}
           <div className={cn(
             "flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-lg transition-colors",
             isCritical 
               ? "bg-[#FEF2F2] border-[#EF4444] text-[#EF4444] animate-pulse text-xl" 
               : isWarning 
                 ? "bg-[#FFFBEB] border-[#F59E0B] text-[#F59E0B]" 
                 : "bg-[#EFF6FF] border-[#3B82F6] text-[#334155]"
           )}>
             <Clock className="w-5 h-5 opacity-70" />
             {formattedTime}
           </div>

           <Button 
             variant="outline" 
             onClick={() => submitMutation.mutate()}
             className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
             disabled={submitMutation.isPending}
           >
             <LogOut className="w-4 h-4 mr-2 hidden sm:block" />
             Finish Exam
           </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left: Question Content */}
        <div className="flex-1 space-y-6">
           <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="text-[#64748B] border-[#D1D5DB] font-semibold text-sm">
                Question {currentQuestionIdx + 1} of {questions.length}
              </Badge>
              <Badge variant="secondary" className="bg-[#E5E7EB] text-[#334155] font-semibold text-sm">
                 {currentQuestion.points} Points
              </Badge>
           </div>

           <Card className="border-[#D1D5DB] shadow-sm p-6 sm:p-8 bg-white min-h-[400px]">
              <h2 className="text-xl sm:text-2xl font-bold text-[#334155] leading-relaxed mb-8">
                {currentQuestion.title}
              </h2>

              {currentQuestion.type === 'TEXT' ? (
                 <Textarea 
                   placeholder="Type your detailed answer here..."
                   className="min-h-[250px] resize-y text-base p-4 border-[#D1D5DB] focus:border-[#6633FF]"
                   value={mergedAnswers[currentQuestion.id]?.textAnswer || ''}
                   onChange={(e) => handleAnswerUpdate(currentQuestion.id, { 
                      selectedOptionIds: [], 
                      textAnswer: e.target.value 
                   })}
                 />
              ) : (
                 <div className="space-y-3">
                   {currentQuestion.options.map((option, optIdx: number) => {
                     const isSelected = mergedAnswers[currentQuestion.id]?.selectedOptionIds?.includes(option.id);
                      return (
                         <div 
                           key={option.id}
                           onClick={() => handleToggleOption(currentQuestion.id, currentQuestion.type, option.id)}
                           className={cn(
                             "p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 group",
                             isSelected 
                               ? "border-[#6633FF] bg-[#EFF6FF]" 
                               : "border-[#E5E7EB] hover:border-[#D1D5DB] bg-white"
                           )}
                         >
                            <div className={cn(
                               "w-6 h-6 shrink-0 flex items-center justify-center border-2 text-xs font-bold transition-colors",
                               currentQuestion.type === 'RADIO' ? 'rounded-full' : 'rounded-md',
                               isSelected 
                                 ? "border-[#6633FF] bg-[#6633FF] text-white" 
                                 : "border-[#D1D5DB] text-[#94A3B8] group-hover:border-[#94A3B8]"
                            )}>
                               {isSelected && currentQuestion.type === 'CHECKBOX' ? '✓' : String.fromCharCode(65 + optIdx)}
                            </div>
                            <span className={cn("text-base", isSelected ? "text-[#334155] font-medium" : "text-[#64748B]")}>
                              {option.text}
                            </span>
                         </div>
                      );
                   })}
                 </div>
              )}
           </Card>

           {/* Navigation Buttons */}
           <div className="flex items-center justify-between pt-4">
              <Button 
                variant="outline" 
                className="bg-white"
                onClick={() => setCurrentQuestionIdx(idx => Math.max(0, idx - 1))}
                disabled={currentQuestionIdx === 0}
              >
                Previous
              </Button>
              
              {currentQuestionIdx === questions.length - 1 ? (
                 <Button 
                   className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                   onClick={() => submitMutation.mutate()}
                   disabled={submitMutation.isPending}
                 >
                   Submit Assessment
                 </Button>
              ) : (
                <Button 
                   className="btn-primary"
                   onClick={() => setCurrentQuestionIdx(idx => Math.min(questions.length - 1, idx + 1))}
                 >
                   Next Question
                 </Button>
              )}
           </div>
        </div>

        {/* Right: Question Navigator Panel */}
        <div className="w-full lg:w-72 shrink-0">
           <Card className="border-[#D1D5DB] shadow-sm bg-white sticky top-24">
             <div className="p-4 border-b border-[#F1F5F9] font-semibold text-[#334155]">
               Question Navigator
             </div>
             <div className="p-4 grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-4 gap-2">
               {questions.map((q, idx: number) => {
                 const ans = mergedAnswers[q.id];
                   const isAttempted = ans && (
                      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) || 
                      (ans.textAnswer && ans.textAnswer.trim().length > 0)
                   );
                   const isCurrent = currentQuestionIdx === idx;

                   return (
                     <button
                       key={q.id}
                       onClick={() => setCurrentQuestionIdx(idx)}
                       className={cn(
                         "h-10 rounded-lg text-sm font-bold border transition-all relative overflow-hidden",
                         isAttempted 
                           ? "border-[#6633FF] bg-[#F1F5F9] text-[#6633FF]" 
                           : "border-[#E5E7EB] bg-white text-[#94A3B8]",
                         isCurrent && "ring-2 ring-[#6633FF] ring-offset-1 border-transparent",
                         !isAttempted && "hover:border-[#94A3B8]"
                       )}
                     >
                       {isAttempted && !isCurrent && (
                          <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-l-[10px] border-t-[#6633FF] border-l-transparent" />
                       )}
                       {idx + 1}
                     </button>
                   );
                })}
             </div>
             <div className="p-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex flex-col gap-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-[#F1F5F9] border border-[#6633FF]" />
                  <span>Attempted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-white border border-[#E5E7EB]" />
                  <span>Unattempted</span>
                </div>
             </div>
           </Card>
        </div>
      </main>

      {/* Re-request fullscreen banner if they escaped but haven't hit limit yet */}
      {attempt.violations > 0 && !isFullscreen && (
         <div className="fixed bottom-0 left-0 right-0 bg-[#EF4444] text-white p-3 text-center sm:text-lg font-bold flex items-center justify-center gap-4 z-[9999] animate-slide-up">
           <AlertTriangle className="w-6 h-6 animate-pulse" />
           WARNING: You have exited Fullscreen. Return immediately or your exam will be terminated!
           <Button variant="secondary" size="sm" onClick={enterFullscreen} className="bg-white text-[#EF4444] hover:bg-[#FEE2E2]">
             Return to Fullscreen
           </Button>
         </div>
      )}
    </div>
  );
}
