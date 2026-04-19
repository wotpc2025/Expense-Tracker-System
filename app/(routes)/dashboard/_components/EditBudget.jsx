"use client"
/**
 * EditBudget.jsx — Edit Budget Dialog
 *
 * Modal dialog triggered by the pencil / Edit button on the budget detail page.
 * Allows editing: emoji icon, budget name, budget amount, and default category.
 *
 * Features:
 *   - EmojiPicker (emoji-picker-react library) for icon selection
 *   - Category dropdown: combines DEFAULT_EXPENSE_CATEGORIES with any custom
 *     categories already used in the budget's existing expenses (uniqueCategories memo)
 *   - "Sync Category" action: bulk-updates ALL existing expenses under this
 *     budget to match the newly selected category (with confirmation dialog)
 *
 * Data flow:
 *   - updateBudgetAction(budgetInfo, name, amount, emoji, category)  → saves changes
 *   - syncBudgetCategoryToExpensesAction(budgetId, category)         → bulk sync
 *   - refreshData() callback re-fetches data in the parent page after save
 *
 * Props:
 *   budgetInfo   {object}   - current budget data (id, name, amount, icon, category)
 *   refreshData  {function} - called after successful save to update parent state
 *   expensesList {object[]} - existing expenses for this budget (for category options)
 */
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
import { useEffect, useMemo, useState } from 'react';
import { syncBudgetCategoryToExpensesAction, updateBudgetAction } from '@/app/_actions/dbActions';
import { toast } from 'sonner';
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/expenseCategories';
import { t } from '@/lib/text'
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


function EditBudget({budgetInfo, refreshData, expensesList = []}) {
  const language = 'en';
  const [emojiIcon,setEmojiIcon]=useState(budgetInfo?.icon || '😀');
    const [openEmojiPicker,setOpenEmojiPicker]=useState(false);

  const [name,setName]=useState(budgetInfo?.name || '');
  const [amount,setAmount]=useState(budgetInfo?.amount || '');
  const [category,setCategory]=useState(budgetInfo?.category || '');
  const [syncingCategory, setSyncingCategory] = useState(false);

  const uniqueCategories = useMemo(() => {
    const cats = new Set([
      ...DEFAULT_EXPENSE_CATEGORIES,
      budgetInfo?.category,
      ...expensesList.map(e => e.category).filter(Boolean),
    ])
    return Array.from(cats).filter(Boolean).sort()
  }, [expensesList, budgetInfo?.category])

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
          toast.success(t('updateSuccess'));
        } else {
          toast.error(t('updateError'));
        }
    }

    const onSyncCategoryToExistingExpenses = async () => {
      if (!budgetInfo?.id) return;

      const normalizedCategory = String(category || '').trim();
      if (!normalizedCategory) {
        toast.error(t('editBudget.requireCategory'));
        return;
      }

      try {
        setSyncingCategory(true);
        const result = await syncBudgetCategoryToExpensesAction(budgetInfo.id, normalizedCategory);
        if (!result?.success) {
          toast.error(result?.error || t('editBudget.syncFailed'));
          return;
        }

        toast.success(t('editBudget.syncSuccess').replace('{count}', String(result.count)));
        refreshData?.();
      } finally {
        setSyncingCategory(false);
      }
    }

  return (
    <div suppressHydrationWarning>
     <Dialog>
              <DialogTrigger asChild>
            <Button className='flex gap-2 cursor-pointer' variant=''> <PenBox/> {t('edit')}</Button>
              </DialogTrigger>
              <DialogContent suppressHydrationWarning>
                  <DialogHeader>
              <DialogTitle>{t('editBudget.title')}</DialogTitle>
                      <DialogDescription>
                        <div className='mt-5'>
                          <Button variant="outline"
                          className="cursor-pointer text-lg"
                          onClick={()=>setOpenEmojiPicker(!openEmojiPicker)}
                          >{emojiIcon}</Button>
                          <div className='absolute z-20 shadow-lg bg-white rounded-xl dark:bg-slate-800'>
                            <EmojiPicker
                            open={openEmojiPicker}
                            onEmojiClick={(e)=>{
                              setEmojiIcon(e.emoji)
                              setOpenEmojiPicker(false)
                            }}
                            />
                          </div>
                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1 dark:text-white'>{t('editBudget.budgetName')}</h2>
                            <Input placeholder={t('placeholder.budgetName')}
                            value={name}
                            autoComplete="on"
                            onChange={(e)=>setName(e.target.value)}/>
                          </div>
                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1 dark:text-white'>{t('editBudget.budgetAmount')}</h2>
                            <Input 
                            type="number"
                            placeholder={t('placeholder.budgetAmount')}
                            value={amount}
                            autoComplete="on"
                            onChange={(e)=>setAmount(e.target.value)}/>
                          </div>

                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1 dark:text-white'>{t('editBudget.defaultCategory')}</h2>
                            {budgetInfo?.category && (
                              <p className='text-xs text-slate-500 dark:text-slate-400 mb-1'>{t('editBudget.currentCategory')}: <span className='font-semibold text-slate-700 dark:text-slate-300'>{budgetInfo.category}</span></p>
                            )}
                            <select
                              value={category}
                              onChange={(e)=>setCategory(e.target.value)}
                              className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 cursor-pointer'
                            >
                              <option value=''>-- {t('editBudget.selectCategory')} --</option>
                              {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
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
                                  {t('editBudget.syncCategory')}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('editBudget.syncTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('editBudget.syncDescription').replace('{category}', category || '-')}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={onSyncCategoryToExistingExpenses}
                                  >
                                    {t('editBudget.confirmSync')}
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
                            {t('editBudget.updateButton')}
                        </Button>
                      </DialogClose>
                    </DialogFooter>
              </DialogContent>
          </Dialog>
    </div>
  )
}

export default EditBudget