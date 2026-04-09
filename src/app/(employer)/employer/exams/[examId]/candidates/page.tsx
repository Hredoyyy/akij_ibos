'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CandidateAttempt {
  id: string;
  candidate: {
    name: string | null;
    email: string;
  };
  examSlot: {
    slotNumber: number;
    startTime: string;
  };
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  status: string;
  violations: number;
}

export default function ViewCandidatesPage() {
  const router = useRouter();
  const { examId } = useParams();

  const { data: candidates, isLoading } = useQuery<CandidateAttempt[]>({
    queryKey: ['examCandidates', examId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/exams/${examId}/candidates`);
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge variant="outline" className="text-[#3B82F6] border-[#3B82F6] bg-[#EFF6FF]">In Progress</Badge>;
      case 'SUBMITTED':
        return <Badge variant="outline" className="text-[#22C55E] border-[#22C55E] bg-[#F0FDF4]">Completed</Badge>;
      case 'TIMED_OUT':
        return <Badge variant="outline" className="text-[#F59E0B] border-[#F59E0B] bg-[#FFFBEB]">Timed Out</Badge>;
      case 'VIOLATION_TERMINATED':
        return <Badge variant="outline" className="text-[#EF4444] border-[#EF4444] bg-[#FEF2F2]">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center gap-4 border-b border-[#E5E7EB] pb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/employer/dashboard')}
          className="rounded-full w-10 h-10 bg-white shadow-sm border border-[#F1F5F9] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="w-5 h-5 text-[#334155]" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Candidate Results</h1>
          <p className="text-[#64748B] text-sm mt-0.5">View and manage test attempts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#D1D5DB] overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] bg-[#F8FAFC] flex justify-between items-center">
          <div className="flex items-center gap-2 text-[#334155] font-semibold">
            <Users className="w-5 h-5 text-[#6633FF]" />
            <span>All Participants ({candidates?.length || 0})</span>
          </div>
        </div>

        {isLoading ? (
           <div className="p-8 flex justify-center">
             <div className="w-8 h-8 rounded-full border-2 border-[#6633FF] border-t-transparent animate-spin" />
           </div>
        ) : candidates?.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[#94A3B8]" />
            </div>
            <h3 className="text-[#334155] font-medium text-lg">No candidates yet</h3>
            <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
              Candidates will appear here once they start the assessment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <Table>
              <TableHeader>
                <TableRow className="border-[#E5E7EB] hover:bg-transparent">
                  <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wider">Candidate</TableHead>
                  <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wider">Slot / Time</TableHead>
                  <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wider">Violations</TableHead>
                  <TableHead className="text-[#64748B] font-semibold text-xs uppercase tracking-wider text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates?.map((attempt) => (
                  <TableRow key={attempt.id} className="border-[#F1F5F9]">
                    <TableCell className="py-4">
                      <div className="font-medium text-[#334155]">
                        {attempt.candidate.name || 'Anonymous User'}
                      </div>
                      <div className="text-xs text-[#94A3B8] mt-0.5">
                        {attempt.candidate.email}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="font-medium text-[#334155]">Slot {attempt.examSlot.slotNumber}</div>
                      <div className="text-xs text-[#94A3B8] mt-0.5">
                        {format(new Date(attempt.startedAt), 'MMM d, h:mm a')}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(attempt.status)}
                    </TableCell>
                    <TableCell className="py-4">
                      {attempt.violations > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#EF4444] bg-[#FEF2F2] px-2 py-1 rounded inline-flex">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {attempt.violations}
                        </div>
                      ) : (
                        <span className="text-[#64748B] text-xs">None</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      {attempt.score !== null ? (
                        <div className="font-bold text-lg text-[#334155]">{attempt.score}</div>
                      ) : (
                        <span className="text-[#94A3B8] text-xs font-medium">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
