'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Users, Clock, BookOpen, Layers } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ExamWithStats {
  id: string;
  title: string;
  totalCandidates: number;
  totalSlots: number;
  createdAt: string;
  _count: {
    attempts: number;
  };
  slots: {
    startTime: string;
    endTime: string;
    questionSet: {
      _count: { questions: number };
    };
  }[];
}

export default function EmployerDashboard() {
  const { data: exams, isLoading, error } = useQuery<ExamWithStats[]>({
    queryKey: ['employerExams'],
    queryFn: async () => {
      const { data } = await axios.get('/api/exams');
      return data;
    },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#334155]">Exams Repository</h1>
          <p className="text-[#64748B] mt-1">Manage and track your online assessments</p>
        </div>
        <Link
          href="/employer/exams/create"
          className="btn-primary shrink-0"
        >
          <Plus className="w-5 h-5" />
          Create Online Test
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-white border border-[#D1D5DB] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          Failed to load exams. Please try again later.
        </div>
      ) : exams?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-[#D1D5DB] border-dashed">
          <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4 text-[#94A3B8]">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#334155]">No Exams Created</h3>
          <p className="text-[#64748B] mb-6 max-w-md">
            You haven&apos;t created any assessments yet. Get started by creating your first online test.
          </p>
          <Link href="/employer/exams/create" className="btn-primary">
            Create First Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams?.map((exam) => (
            <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-[#F8FAFC] bg-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold line-clamp-1" title={exam.title}>
                      {exam.title}
                    </CardTitle>
                    <p className="text-xs text-[#94A3B8]">
                      Created {format(new Date(exam.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-[#F1F5F9] text-[#64748B] hover:bg-[#F1F5F9]">
                    {exam.slots.length} Slots
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9] flex flex-col gap-1">
                    <div className="flex items-center text-[#94A3B8] text-xs font-medium">
                      <Users className="w-3.5 h-3.5 mr-1" /> Candidates
                    </div>
                    <div className="text-base font-bold text-[#334155]">
                      {exam._count.attempts} <span className="text-[#94A3B8] font-normal text-sm">/ {exam.totalCandidates}</span>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#F1F5F9] flex flex-col gap-1">
                    <div className="flex items-center text-[#94A3B8] text-xs font-medium">
                      <BookOpen className="w-3.5 h-3.5 mr-1" /> Questions
                    </div>
                    <div className="text-base font-bold text-[#334155]">
                      {exam.slots[0]?.questionSet._count.questions || 0}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-[#64748B] pt-1">
                  <Clock className="w-4 h-4 text-[#94A3B8]" />
                  <span>
                    {exam.slots[0] ? format(new Date(exam.slots[0].startTime), 'MMM d, h:mm a') : 'No slots set'}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-4 bg-white border-t border-[#F1F5F9]">
                <Link
                  href={`/employer/exams/${exam.id}/candidates`}
                  className="w-full btn-outline bg-white hover:bg-[#F8FAFC]"
                >
                  View Candidates
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
