"use client";

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createBudgetWithExpensesAction } from '@/app/_actions/dbActions';

function AIBudgetAssistant({ refreshData, trigger }) {
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter your prompt first');
      return;
    }

    try {
      setLoadingPlan(true);
      const response = await fetch('/api/ai/generate-budget-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          locale: 'th-TH',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        toast.error(result?.error || 'Unable to generate plan');
        return;
      }

      setPlan(result);
      toast.success('AI plan generated');
    } catch (error) {
      console.error('generate plan error:', error);
      toast.error('Unable to generate plan right now');
    } finally {
      setLoadingPlan(false);
    }
  };

  const applyPlan = async () => {
    if (!plan) return;

    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      toast.error('Please sign in before creating plan');
      return;
    }

    try {
      setCreatingPlan(true);
      const result = await createBudgetWithExpensesAction({
        createdBy: email,
        budgetName: plan.budgetName,
        budgetAmount: plan.budgetAmount,
        icon: plan.icon,
        starterExpenses: plan.starterExpenses,
      });

      if (!result?.success) {
        toast.error(result?.error || 'Failed to create AI budget');
        return;
      }

      toast.success('AI budget and expenses created');
      refreshData && refreshData();
      setPlan(null);
      setPrompt('');
      setOpen(false);
    } catch (error) {
      console.error('apply plan error:', error);
      toast.error('Unable to create plan right now');
    } finally {
      setCreatingPlan(false);
    }
  };

  const content = (
    <div className='space-y-3'>
      <textarea
        placeholder='Prompt example: I earn 45,000 THB/month. Help me create a realistic budget for food, transport, and emergency savings.'
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className='w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none'
      />

      <Button
        type='button'
        onClick={generatePlan}
        disabled={loadingPlan || creatingPlan}
        className='w-full bg-linear-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white cursor-pointer'
      >
        {loadingPlan ? <Loader2 className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4 mr-1' />}
        {loadingPlan ? 'Generating...' : 'Generate AI Plan'}
      </Button>

      {plan && (
        <div className='rounded-md border bg-white p-3'>
          <div className='flex items-center justify-between'>
            <h4 className='font-semibold'>
              {plan.icon || '💰'} {plan.budgetName}
            </h4>
            <span className='font-bold text-emerald-600'>฿{Number(plan.budgetAmount || 0).toLocaleString('en-US')}</span>
          </div>

          <p className='text-xs text-slate-500 mt-1'>{plan.notes || 'AI suggested starter expenses below.'}</p>

          <div className='mt-2 space-y-1'>
            {(plan.starterExpenses || []).slice(0, 6).map((expense, index) => (
              <div key={`${expense.name}-${index}`} className='flex justify-between text-sm'>
                <span>{expense.name}</span>
                <span>฿{Number(expense.amount || 0).toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>

          <Button
            type='button'
            onClick={applyPlan}
            disabled={creatingPlan || loadingPlan}
            className='w-full mt-3 cursor-pointer'
          >
            {creatingPlan ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
            {creatingPlan ? 'Creating...' : 'Create Budget + Expenses'}
          </Button>
        </div>
      )}
    </div>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-violet-600' />
              AI Budget Assistant
            </DialogTitle>
            <DialogDescription>
              Describe anything in freestyle and AI will create a starter budget with suggested expenses.
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className='rounded-md border p-5 bg-linear-to-br from-slate-50 to-white'>
      <div className='flex items-center gap-2 mb-3'>
        <Sparkles className='h-5 w-5 text-violet-600' />
        <h3 className='font-bold text-base'>AI Budget Assistant</h3>
      </div>
      <p className='text-sm text-slate-600 mb-3'>
        Describe anything in freestyle and AI will create a starter budget with suggested expenses.
      </p>
      {content}
    </div>
  );
}

export default AIBudgetAssistant;
