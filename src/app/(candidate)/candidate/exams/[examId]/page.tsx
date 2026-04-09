'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Clock, ShieldAlert, MonitorPlay, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExamIntroQuestion {
  id: string;
}

interface ExamIntroSlot {
  id: string;
  questionSet: {
    questions: ExamIntroQuestion[];
  };
}

interface ExamIntroResponse {
  id: string;
  title: string;
  duration: number;
  negativeMarking: boolean;
  slots: ExamIntroSlot[];
}

export default function ExamIntroPage() {
  const router = useRouter();
  const { examId } = useParams();
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slot');

  const [hasAgreed, setHasAgreed] = useState(false);

  const { data: exam, isLoading } = useQuery<ExamIntroResponse>({
    queryKey: ['examDetails', examId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/exams/${examId}`);
      return data;
    },
    enabled: !!examId,
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/attempts', {
        examId,
        examSlotId: slotId,
      });
      return data;
    },
    onSuccess: (data) => {
      router.push(`/candidate/attempts/${data.id}`);
    },
    onError: (error) => {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        toast.error(error.response?.data?.error || 'Failed to start exam');
        return;
      }

      toast.error('Failed to start exam');
    },
  });

  const handleStartExam = () => {
    if (!hasAgreed) {
      toast.error('You must agree to the instructions first.');
      return;
    }
    if (!slotId) {
      toast.error('Invalid slot. Please return to the dashboard.');
      return;
    }
    startMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#6633FF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#334155]">Exam not found</h2>
        <Button onClick={() => router.push('/candidate/dashboard')} variant="outline" className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const slot = exam.slots.find((s) => s.id === slotId);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in relative pb-24">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[#334155] mb-2">{exam.title}</h1>
      <p className="text-[#64748B]">Please read the instructions carefully before starting the assessment.</p>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-[#D1D5DB] shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#334155]">Duration</h3>
            <p className="text-sm text-[#64748B] mt-0.5">{exam.duration} Minutes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D1D5DB] shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center shrink-0">
            <MonitorPlay className="w-5 h-5 text-[#22C55E]" />
          </div>
           <div>
            <h3 className="font-semibold text-[#334155]">Question Count</h3>
            <p className="text-sm text-[#64748B] mt-0.5">
              {slot?.questionSet.questions.length || 0} Questions
            </p>
          </div>
        </div>
      </div>

      {/* Rules block */}
      <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-[#334155] flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-[#6633FF]" />
          Rules & Conduct
        </h2>

        <ul className="space-y-4">
          <li className="flex gap-3 text-[#334155]">
            <div className="mt-1 w-1.5 h-1.5 bg-[#6633FF] rounded-full shrink-0" />
            <p><strong className="font-semibold">Fullscreen Enforced:</strong> The exam will open in fullscreen mode. Exiting fullscreen is recorded as a violation.</p>
          </li>
          <li className="flex gap-3 text-[#334155]">
            <div className="mt-1 w-1.5 h-1.5 bg-[#6633FF] rounded-full shrink-0" />
            <p><strong className="font-semibold">Anti-Cheating Mechanisms:</strong> Tab switching, window blurring, and common keyboard shortcuts (copy/paste) are disabled and tracked. <span className="text-[#EF4444] font-semibold">3 violations</span> will result in immediate termination of the exam.</p>
          </li>
          <li className="flex gap-3 text-[#334155]">
             <div className="mt-1 w-1.5 h-1.5 bg-[#6633FF] rounded-full shrink-0" />
             <p><strong className="font-semibold">Timer:</strong> The timer starts immediately when you click start. It continues running even if you refresh or switch devices.</p>
          </li>
          {exam.negativeMarking && (
             <li className="flex gap-3 text-[#F59E0B]">
               <div className="mt-1 w-1.5 h-1.5 bg-[#F59E0B] rounded-full shrink-0" />
               <p><strong className="font-semibold">Negative Marking:</strong> Deductions will occur for incorrect Multiple Choice answers.</p>
             </li>
          )}
        </ul>

        <div className="pt-6 border-t border-[#D1D5DB]">
          <label className="flex items-start gap-3 cursor-pointer group">
             <div className="mt-0.5 shrink-0">
               <input 
                 type="checkbox" 
                 checked={hasAgreed}
                 onChange={(e) => setHasAgreed(e.target.checked)}
                 className="w-5 h-5 rounded border-[#D1D5DB] text-[#6633FF] focus:ring-[#6633FF] transition-colors cursor-pointer"
               />
             </div>
             <p className="text-sm font-medium text-[#334155] group-hover:text-black transition-colors">
               I have read and understood the rules. I agree to maintain academic integrity and understand that violations will lead to auto-submission.
             </p>
          </label>
        </div>
      </div>

       {/* Floating Action Bar */}
       <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#E5E7EB] z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="btn-outline bg-white"
            onClick={() => router.push('/candidate/dashboard')}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="btn-primary"
            onClick={handleStartExam}
            disabled={!hasAgreed || startMutation.isPending}
          >
            {startMutation.isPending ? (
               <>
                 <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                 Starting...
               </>
            ) : (
                <>
                  Start Assessment <ChevronRight className="w-4 h-4 ml-1" />
                </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
