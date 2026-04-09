'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, PlusCircle } from 'lucide-react';
import { useCreateExamStore, createNewQuestion, createNewOption } from '@/stores/useCreateExamStore';
import type { DraftQuestion } from '@/stores/useCreateExamStore';
import type { QuestionType } from '@prisma/client';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotNumber: number;
  initialQuestion: DraftQuestion | null;
}

export function QuestionModal({ isOpen, onClose, slotNumber, initialQuestion }: QuestionModalProps) {
  const { addQuestion, updateQuestion, slots } = useCreateExamStore();
  
  const slot = slots.find(s => s.slotNumber === slotNumber);
  const nextOrder = slot ? slot.questionSet.questions.length + 1 : 1;

  const [question, setQuestion] = useState<DraftQuestion>(() => 
    initialQuestion ? { ...initialQuestion } : createNewQuestion(nextOrder)
  );

  const handleSave = () => {
    if (!question.title) return; // Simple validation

    if (initialQuestion) {
      updateQuestion(slotNumber, question.id, question);
    } else {
      addQuestion(slotNumber, question);
    }
    onClose();
  };

  const addOption = () => {
    setQuestion((prev) => ({
      ...prev,
      options: [...prev.options, createNewOption()],
    }));
  };

  const removeOption = (optId: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== optId),
    }));
  };

  const updateOptionText = (optId: string, text: string) => {
    setQuestion((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === optId ? { ...o, text } : o)),
    }));
  };

  const updateOptionCorrect = (optId: string, isCorrect: boolean) => {
    setQuestion((prev) => {
      let newOptions = [...prev.options];
      
      // If it's a RADIO, only one can be correct
      if (prev.type === 'RADIO' && isCorrect) {
        newOptions = newOptions.map((o) => ({ ...o, isCorrect: o.id === optId }));
      } else {
        newOptions = newOptions.map((o) => (o.id === optId ? { ...o, isCorrect } : o));
      }

      return { ...prev, options: newOptions };
    });
  };

  const handleTypeChange = (value: string | null) => {
    if (!value) return;
    const type = value as QuestionType;
    setQuestion(prev => {
      let newOptions = prev.options;
      if (type === 'RADIO') {
        const firstCorrect = newOptions.find(o => o.isCorrect);
        // Reset so only one is correct
        newOptions = newOptions.map(o => ({ ...o, isCorrect: firstCorrect ? o.id === firstCorrect.id : false }));
      } else if (type === 'TEXT') {
        newOptions = [];
      } else if (prev.type === 'TEXT') {
         newOptions = createNewQuestion(1).options; // Reset defaults
      }
      return { ...prev, type, options: newOptions };
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white border-[#D1D5DB] p-0 overflow-hidden shadow-xl rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <DialogTitle className="text-xl text-[#334155]">
            {initialQuestion ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label className="text-[#334155] font-semibold">Question Type</Label>
              <Select value={question.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="border-[#D1D5DB] focus:ring-[#6633FF] focus:border-[#6633FF] bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RADIO">Single Choice (Radio)</SelectItem>
                  <SelectItem value="CHECKBOX">Multiple Choice (Checkbox)</SelectItem>
                  <SelectItem value="TEXT">Descriptive (Text)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 space-y-2">
              <Label className="text-[#334155] font-semibold">Points</Label>
              <Input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => setQuestion({ ...question, points: parseInt(e.target.value) || 1 })}
                className="input-field"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[#334155] font-semibold">Question Title <span className="text-red-500">*</span></Label>
            <Input
              value={question.title}
              onChange={(e) => setQuestion({ ...question, title: e.target.value })}
              placeholder="e.g. What is the output of 2 + 2 in JavaScript?"
              className="input-field h-12"
            />
          </div>

          {question.type !== 'TEXT' && (
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <Label className="text-[#334155] font-semibold">Options</Label>
                 <span className="text-xs text-[#64748B]">Set correct answer(s) with the switch</span>
               </div>
               
               <div className="space-y-3">
                 {question.options.map((opt, index) => (
                   <div key={opt.id} className="flex items-center gap-3 bg-[#F8FAFC] p-2 pr-4 rounded-xl border border-[#F1F5F9]">
                     <div className="flex items-center gap-3 px-2 border-r border-[#E5E7EB]">
                        <span className="text-xs font-bold text-[#94A3B8] w-4">{String.fromCharCode(65 + index)}</span>
                        <Switch
                          checked={opt.isCorrect}
                          onCheckedChange={(c) => updateOptionCorrect(opt.id, c)}
                          className="data-[state=checked]:bg-[#22C55E]"
                        />
                     </div>
                     <Input
                       value={opt.text}
                       onChange={(e) => updateOptionText(opt.id, e.target.value)}
                       placeholder={`Option ${index + 1}`}
                       className="flex-1 bg-white border-transparent focus:border-[#6633FF] shadow-sm ml-1"
                     />
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => removeOption(opt.id)}
                       disabled={question.options.length <= 2}
                       className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg shrink-0 w-8 h-8"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 ))}
               </div>

               <Button 
                variant="outline" 
                onClick={addOption}
                className="w-full border-dashed border-2 border-[#D1D5DB] text-[#64748B] hover:border-[#6633FF] hover:text-[#6633FF] py-6 rounded-xl"
               >
                 <PlusCircle className="w-5 h-5 mr-2" /> Add Option
               </Button>
             </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t border-[#F1F5F9] bg-[#F8FAFC]">
          <Button variant="outline" onClick={onClose} className="bg-white">Cancel</Button>
          <Button onClick={handleSave} className="bg-[#6633FF] hover:bg-[#5528DD] text-white" disabled={!question.title}>
             {initialQuestion ? 'Update Question' : 'Save Question'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
