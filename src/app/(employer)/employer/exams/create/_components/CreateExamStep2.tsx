'use client';

import { useCreateExamStore } from '@/stores/useCreateExamStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Tag, CalendarClock } from 'lucide-react';
import { useState } from 'react';
import { QuestionModal } from './QuestionModal';
import { Badge } from '@/components/ui/badge';
import type { DraftQuestion } from '@/stores/useCreateExamStore';

export function CreateExamStep2() {
  const { slots, updateSlotTime, removeQuestion } = useCreateExamStore();
  const [activeTab, setActiveTab] = useState('slot-1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{ slotNumber: number; question: DraftQuestion | null } | null>(null);

  if (slots.length === 0) return null;

  const handleOpenModal = (slotNumber: number, question: DraftQuestion | null) => {
    setEditingQuestion({ slotNumber, question });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border border-[#D1D5DB] w-full justify-start overflow-x-auto p-1 rounded-xl h-auto">
          {slots.map((slot) => (
            <TabsTrigger
              key={slot.slotNumber}
              value={`slot-${slot.slotNumber}`}
              className="rounded-lg data-[state=active]:bg-[#F1F5F9] data-[state=active]:text-[#6633FF] data-[state=active]:font-semibold py-2 px-4"
            >
              Slot {slot.slotNumber}
            </TabsTrigger>
          ))}
        </TabsList>

        {slots.map((slot) => (
          <TabsContent key={slot.slotNumber} value={`slot-${slot.slotNumber}`} className="space-y-6 mt-6">
            {/* Slot Config */}
            <Card className="border-[#D1D5DB] shadow-sm">
              <CardHeader className="pb-4 border-b border-[#F8FAFC]">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-[#6633FF]" />
                  <CardTitle className="text-xl">Time Window</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[#334155] font-semibold">Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={slot.startTime}
                    onChange={(e) => updateSlotTime(slot.slotNumber, 'startTime', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#334155] font-semibold">End Time</Label>
                  <Input
                    type="datetime-local"
                    value={slot.endTime}
                    onChange={(e) => updateSlotTime(slot.slotNumber, 'endTime', e.target.value)}
                    className="input-field"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Question Set */}
            <Card className="border-[#D1D5DB] shadow-sm overflow-hidden">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E5E7EB] pb-4 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{slot.questionSet.name}</CardTitle>
                    <Badge variant="secondary" className="bg-[#E5E7EB] text-[#334155] hover:bg-[#D1D5DB]">
                      {slot.questionSet.questions.length} Questions
                    </Badge>
                  </div>
                  <p className="text-sm text-[#64748B]">Questions specifically for Slot {slot.slotNumber}</p>
                </div>
                <Button
                  onClick={() => handleOpenModal(slot.slotNumber, null)}
                  className="bg-[#6633FF] hover:bg-[#5528DD] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {slot.questionSet.questions.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                    <div className="w-12 h-12 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-3">
                      <Tag className="w-6 h-6 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[#334155] font-medium">No questions added yet</p>
                    <p className="text-[#64748B] text-sm mt-1 mb-4">Add questions to build your assessment set.</p>
                    <Button variant="outline" onClick={() => handleOpenModal(slot.slotNumber, null)} className="border-[#6633FF] text-[#6633FF]">
                      <Plus className="w-4 h-4 mr-2" /> Add First Question
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {slot.questionSet.questions.map((q, idx) => (
                      <div key={q.id} className="p-4 hover:bg-[#F8FAFC] transition-colors flex items-start justify-between group">
                        <div className="space-y-2 max-w-[80%] cursor-pointer" onClick={() => handleOpenModal(slot.slotNumber, q)}>
                          <div className="flex items-center gap-2 text-sm text-[#64748B] font-medium">
                            <span>Q{idx + 1}</span> • <Badge variant="outline" className="text-xs py-0 h-5 border-[#6633FF] text-[#6633FF]">{q.type}</Badge> • <span>{q.points} pt</span>
                          </div>
                          <p className="font-medium text-[#334155]">{q.title}</p>
                          {(q.type === 'RADIO' || q.type === 'CHECKBOX') && (
                            <div className="flex gap-2 text-xs text-[#9CA3AF]">
                              <span>{q.options.length} options</span>
                              <span>•</span>
                              <span className="text-[#22C55E]">{q.options.filter(o => o.isCorrect).length} correct</span>
                            </div>
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(slot.slotNumber, q)} className="text-[#3B82F6] hover:text-[#2563EB] hover:bg-[#EFF6FF]">
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeQuestion(slot.slotNumber, q.id)} className="text-[#EF4444] hover:text-[#DC2626] hover:bg-[#FEF2F2]">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {isModalOpen && editingQuestion && (
        <QuestionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingQuestion(null);
          }}
          slotNumber={editingQuestion.slotNumber}
          initialQuestion={editingQuestion.question}
        />
      )}
    </div>
  );
}
