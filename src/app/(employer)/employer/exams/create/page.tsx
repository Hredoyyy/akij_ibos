'use client';

import { useCreateExamStore } from '@/stores/useCreateExamStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CreateExamStep2 } from './_components/CreateExamStep2';

export default function CreateExamPage() {
  const router = useRouter();
  const {
    currentStep,
    setStep,
    title,
    totalCandidates,
    totalSlots,
    duration,
    negativeMarking,
    setBasicInfo,
    initializeSlots,
    slots,
    reset,
  } = useCreateExamStore();

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        totalCandidates,
        totalSlots,
        duration,
        negativeMarking,
        slots,
      };
      const { data } = await axios.post('/api/exams', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Exam created successfully!');
      reset();
      router.push('/employer/dashboard');
    },
    onError: (error) => {
      if (axios.isAxiosError<{ error?: string }>(error)) {
        toast.error(error.response?.data?.error || 'Failed to create exam');
        return;
      }

      toast.error('Failed to create exam');
    },
  });

  const handleNextStep = () => {
    if (!title || totalCandidates < 1 || totalSlots < 1 || duration < 1) {
      toast.error('Please fill in all required fields correctly');
      return;
    }
    initializeSlots(totalSlots);
    setStep(2);
  };

  const handleSave = () => {
    // Basic validation for Step 2
    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        toast.error(`Please set start and end times for Slot ${slot.slotNumber}`);
        return;
      }
      if (slot.questionSet.questions.length === 0) {
        toast.error(`Please add at least one question to ${slot.questionSet.name}`);
        return;
      }
      for (const q of slot.questionSet.questions) {
        if (!q.title) {
          toast.error(`Please fill in all question titles in ${slot.questionSet.name}`);
          return;
        }
        if (q.type === 'RADIO' || q.type === 'CHECKBOX') {
          const hasCorrect = q.options.some((o) => o.isCorrect);
          if (!hasCorrect) {
            toast.error(`Question "${q.title}" needs at least one correct option`);
            return;
          }
        }
      }
    }

    createMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (currentStep === 2) setStep(1);
            else router.push('/employer/dashboard');
          }}
          className="rounded-full w-10 h-10 bg-white shadow-sm border border-[#F1F5F9] hover:bg-[#F8FAFC]"
        >
          <ArrowLeft className="w-5 h-5 text-[#334155]" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#334155]">Create Online Test</h1>
          <p className="text-[#64748B] text-sm mt-0.5">Step {currentStep} of 2</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 mb-8">
        <div className={cn("h-2 flex-1 rounded-full transition-colors", currentStep >= 1 ? "bg-[#6633FF]" : "bg-[#E5E7EB]")} />
        <div className={cn("h-2 flex-1 rounded-full transition-colors", currentStep >= 2 ? "bg-[#6633FF]" : "bg-[#E5E7EB]")} />
      </div>

      {/* Forms */}
      <div className={cn("transition-all duration-300", currentStep !== 1 ? "hidden" : "block")}>
        <Card className="border-[#D1D5DB] shadow-sm">
          <CardHeader className="border-b border-[#F8FAFC]">
            <CardTitle className="text-xl">Basic Information</CardTitle>
            <CardDescription className="text-[#64748B]">Set the core requirements and constraints for this exam.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[#334155] font-semibold">Exam Title <span className="text-red-500">*</span></Label>
              <Input
                id="title"
                placeholder="e.g. Frontend Developer Assessment 2026"
                value={title}
                onChange={(e) => setBasicInfo({ title: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalCandidates" className="text-[#334155] font-semibold">Total Candidates <span className="text-red-500">*</span></Label>
                <Input
                  id="totalCandidates"
                  type="number"
                  min={1}
                  value={totalCandidates}
                  onChange={(e) => setBasicInfo({ totalCandidates: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalSlots" className="text-[#334155] font-semibold">Number of Slots <span className="text-red-500">*</span></Label>
                <Input
                  id="totalSlots"
                  type="number"
                  min={1}
                  max={4}
                  value={totalSlots}
                  onChange={(e) => setBasicInfo({ totalSlots: parseInt(e.target.value) || 0 })}
                  className="input-field"
                  disabled={currentStep > 1 && slots.length > 0} // Lock after step 1 normally
                />
                <p className="text-xs text-[#94A3B8]">Max 4 slots</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-[#334155] font-semibold">Duration (minutes) <span className="text-red-500">*</span></Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  value={duration}
                  onChange={(e) => setBasicInfo({ duration: parseInt(e.target.value) || 0 })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC]">
              <div className="space-y-0.5">
                <Label className="text-base text-[#334155] font-semibold">Negative Marking</Label>
                <p className="text-sm text-[#64748B]">Deduct 0.25 × question points for incorrect answers (MCQ only)</p>
              </div>
              <Switch
                checked={negativeMarking}
                onCheckedChange={(checked) => setBasicInfo({ negativeMarking: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("transition-all duration-300", currentStep !== 2 ? "hidden" : "block")}>
        <CreateExamStep2 />
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-[#E5E7EB] z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="btn-outline bg-white"
            onClick={() => {
              if (currentStep === 2) setStep(1);
              else router.push('/employer/dashboard');
            }}
          >
            Cancel
          </Button>

          {currentStep === 1 ? (
            <Button
              type="button"
              className="btn-primary"
              onClick={handleNextStep}
            >
              Next: Slots & Questions
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save Draft & Publish
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
