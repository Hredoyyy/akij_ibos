'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, CheckCircle2, ChevronRight, AlertCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AvailableExam {
  id: string;
  title: string;
  duration: number;
  negativeMarking: boolean;
  totalQuestions: number;
  hasAttempted: boolean;
  totalCandidates: number;
  currentCandidates: number;
  activeSlot: {
    id: string;
    slotNumber: number;
    startTime: string;
    endTime: string;
  } | null;
}

export default function CandidateDashboard() {
  const { data: exams, isLoading, error } = useQuery<AvailableExam[]>({
    queryKey: ['candidateAvailableExams'],
    queryFn: async () => {
      const { data } = await axios.get('/api/attempts');
      return data;
    },
    // Refetch often since availability is time-sensitive
    refetchInterval: 60000, 
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#334155]">My Portfolio</h1>
        <p className="text-[#64748B] mt-1">Available assessments tailored for you</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#D1D5DB] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Failed to load available exams.
        </div>
      ) : exams?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-[#D1D5DB] border-dashed">
          <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4 text-[#94A3B8]">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#334155]">No Available Exams</h3>
          <p className="text-[#64748B] mb-6 max-w-md">
            There are currently no active exams within their scheduled time window. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams?.map((exam) => {
             const isFull = exam.currentCandidates >= exam.totalCandidates;

             return (
              <Card key={exam.id} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-all border-[#D1D5DB]">
                <CardHeader className="pb-3 bg-white">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold line-clamp-1" title={exam.title}>
                      {exam.title}
                    </CardTitle>
                    {exam.hasAttempted && (
                      <Badge variant="outline" className="text-[#22C55E] border-[#22C55E] bg-[#F0FDF4] ml-2 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#64748B] flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="font-medium text-[#334155]">{exam.totalQuestions} Questions</span>
                    <span>•</span>
                    <span className="font-medium text-[#334155]">{exam.duration} Minutes</span>
                  </p>
                </CardHeader>

                <CardContent className="flex-1 py-4 space-y-4">
                  {/* Slot Information */}
                  {exam.activeSlot && (
                    <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#6633FF]" />
                      <p className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider mb-1">Time Window</p>
                      <div className="flex items-center gap-2 text-sm text-[#334155] font-medium">
                        <Clock className="w-4 h-4 text-[#6633FF]" />
                        <span>
                          {format(new Date(exam.activeSlot.endTime), 'h:mm a, MMM d')}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1 ml-6">
                        Ends in active slot {exam.activeSlot.slotNumber}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    {exam.negativeMarking && (
                      <div className="flex items-center gap-2 text-sm text-[#F59E0B] bg-[#FFFBEB] px-3 py-1.5 rounded-lg border border-[#FEF3C7] w-fit">
                        <AlertCircle className="w-4 h-4" />
                        Negative Marking Active
                      </div>
                    )}
                    {isFull && !exam.hasAttempted && (
                      <div className="flex items-center gap-2 text-sm text-[#EF4444] bg-[#FEF2F2] px-3 py-1.5 rounded-lg border border-[#FEE2E2] w-fit">
                        <AlertCircle className="w-4 h-4" />
                        Exam Capacity Full
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 pb-4 bg-white border-t border-[#F1F5F9]">
                  {exam.hasAttempted ? (
                    <Button disabled variant="outline" className="w-full bg-[#F8FAFC] text-[#94A3B8] border-transparent font-semibold h-11">
                      Already Completed
                    </Button>
                  ) : isFull ? (
                     <Button disabled variant="outline" className="w-full bg-[#F8FAFC] text-[#94A3B8] border-transparent font-semibold h-11">
                       Full Capacity
                     </Button>
                  ) : !exam.activeSlot ? (
                      <Button disabled variant="outline" className="w-full bg-[#F8FAFC] text-[#94A3B8] border-transparent font-semibold h-11">
                       Wait for next slot
                     </Button>
                  ) : (
                    <Link
                      href={`/candidate/exams/${exam.id}?slot=${exam.activeSlot.id}`}
                      className="w-full"
                    >
                      <Button className="w-full bg-[#6633FF] hover:bg-[#5528DD] text-white font-semibold h-11 rounded-xl">
                        Start Assessment <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
             );
          })}
        </div>
      )}
    </div>
  );
}
