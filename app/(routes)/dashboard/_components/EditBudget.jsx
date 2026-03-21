"use client"
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import EmojiPicker from 'emoji-picker-react';
import { PenBox } from 'lucide-react';
import { useEffect, useState } from 'react';
import { syncBudgetCategoryToExpensesAction, updateBudgetAction } from '@/app/_actions/dbActions';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


function EditBudget({budgetInfo, refreshData}) {
  const [emojiIcon,setEmojiIcon]=useState(budgetInfo?.icon || '😀');
    const [openEmojiPicker,setOpenEmojiPicker]=useState(false);

  const [name,setName]=useState(budgetInfo?.name || '');
  const [amount,setAmount]=useState(budgetInfo?.amount || '');
  const [category,setCategory]=useState(budgetInfo?.category || '');
  const [syncingCategory, setSyncingCategory] = useState(false);

    useEffect(() => {
      if (!budgetInfo) return;
      setEmojiIcon(budgetInfo.icon || '😀');
      setName(budgetInfo.name || '');
      setAmount(budgetInfo.amount || '');
      setCategory(budgetInfo.category || '');
    }, [budgetInfo]);

    const onUpdateBudget = async () => {
      if (!budgetInfo?.id) return;

        // เรียกใช้ Server Action โดยตรง (ไม่ต้องต่อท้ายด้วย .returning เพราะเราเขียนไว้ใน dbActions แล้ว)
        // ต้องส่ง budgetInfo.id ไปด้วยเพื่อระบุว่าเราจะแก้ไข Budget ไหน
        const result = await updateBudgetAction(budgetInfo, name, amount, emojiIcon, category);

        // ถ้าบันทึกสำเร็จ (ผลลัพธ์ไม่เป็น null หรือไม่มี error)
        if (result) 
        {
        refreshData?.(); // รีเฟรชข้อมูลในหน้า
            toast.success('Budget Updated!');
        }
    }

    const onSyncCategoryToExistingExpenses = async () => {
      if (!budgetInfo?.id) return;

      const normalizedCategory = String(category || '').trim();
      if (!normalizedCategory) {
        toast.error('Please set default category first');
        return;
      }

      try {
        setSyncingCategory(true);
        const result = await syncBudgetCategoryToExpensesAction(budgetInfo.id, normalizedCategory);
        if (!result?.success) {
          toast.error(result?.error || 'Sync failed');
          return;
        }

        toast.success(`Category synced to ${result.count} expense(s)`);
        refreshData?.();
      } finally {
        setSyncingCategory(false);
      }
    }

  return (
    <div suppressHydrationWarning>
     <Dialog>
              <DialogTrigger asChild>
                  <Button className='flex gap-2 cursor-pointer' variant=''> <PenBox/> Edit</Button>
              </DialogTrigger>
              <DialogContent suppressHydrationWarning>
                  <DialogHeader>
                      <DialogTitle>Update Budget</DialogTitle>
                      <DialogDescription>
                        <div className='mt-5'>
                          <Button variant="outline"
                          className="cursor-pointer text-lg"
                          onClick={()=>setOpenEmojiPicker(!openEmojiPicker)}
                          >{emojiIcon}</Button>
                          <div className='absolute z-20 shadow-lg bg-white rounded-xl'>
                            <EmojiPicker
                            open={openEmojiPicker}
                            onEmojiClick={(e)=>{
                              setEmojiIcon(e.emoji)
                              setOpenEmojiPicker(false)
                            }}
                            />
                          </div>
                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1'>Budget Name</h2>
                            <Input placeholder="e.g. Home Decor"
                            value={name}
                            autoComplete="on"
                            onChange={(e)=>setName(e.target.value)}/>
                          </div>
                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1'>Budget Amount</h2>
                            <Input 
                            type="number"
                            placeholder="e.g. 5000฿"
                            value={amount}
                            autoComplete="on"
                            onChange={(e)=>setAmount(e.target.value)}/>
                          </div>

                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1'>Default Category (optional)</h2>
                            <Input
                              placeholder='e.g. Food'
                              value={category}
                              autoComplete='on'
                              onChange={(e)=>setCategory(e.target.value)}
                            />
                          </div>

                          <div className='mt-3'>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type='button'
                                  variant='outline'
                                  className='w-full cursor-pointer'
                                  disabled={syncingCategory}
                                >
                                  Sync Category To Existing Expenses
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sync existing expenses?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will update all existing expenses in this budget to category "{category || '-'}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={onSyncCategoryToExistingExpenses}
                                  >
                                    Confirm Sync
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          
                        </div>
                      </DialogDescription>
                  </DialogHeader>
                    <DialogFooter className="sm:justify-start">
                      <DialogClose asChild>
                        <Button 
                            disabled={!(name&&amount)}
                            onClick={()=>onUpdateBudget()}
                          className="mt-5 w-full bg-amber-600
                           hover:bg-amber-700 cursor-pointer">
                            Update Budget
                        </Button>
                      </DialogClose>
                    </DialogFooter>
              </DialogContent>
          </Dialog>
    </div>
  )
}

export default EditBudget