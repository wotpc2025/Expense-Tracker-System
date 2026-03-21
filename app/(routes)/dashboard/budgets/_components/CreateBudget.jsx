"use client"

import React, { useRef, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import EmojiPicker from 'emoji-picker-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUser } from '@clerk/nextjs'
import { createBudgetAction } from '@/app/_actions/dbActions'
import { toast } from 'sonner'
import { Loader2, ScanLine } from 'lucide-react'




function CreateBudget({ refreshData, trigger }) {

    const [emojiIcon,setEmojiIcon]=useState('😀');
    const [openEmojiPicker,setOpenEmojiPicker]=useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const receiptInputRef = useRef(null);

    const [name,setName]=useState();
    const [amount,setAmount]=useState();


    const {user}=useUser();

    const handleReceiptSelection = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setScanLoading(true);
        const formData = new FormData();
        formData.append('receipt', file);

        const response = await fetch('/api/ai/scan-receipt', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result?.error || 'Receipt scan failed');
          return;
        }

        if (result?.expenseName) {
          setName(`${result.expenseName} Budget`);
        }

        if (result?.amount !== null && result?.amount !== undefined) {
          setAmount(String(result.amount));
        }

        toast.success('Receipt scanned with AI');
      } catch (error) {
        console.error('Scan budget receipt error:', error);
        toast.error('Unable to scan receipt right now');
      } finally {
        setScanLoading(false);
        if (receiptInputRef.current) {
          receiptInputRef.current.value = '';
        }
      }
    };

    /**
     * Used to Create New Budget
     */
    const onCreateBudget = async () => {
  // เรียกใช้ Server Action โดยตรง (ไม่ต้องต่อท้ายด้วย .returning เพราะเราเขียนไว้ใน dbActions แล้ว)
  const result = await createBudgetAction({
    name: name,
    amount: amount,
    createdBy: user?.primaryEmailAddress?.emailAddress,
    icon: emojiIcon
  });

  // ถ้าบันทึกสำเร็จ (ผลลัพธ์ไม่เป็น null หรือไม่มี error)
  if (result) 
     {
        refreshData() && refreshData(); // รีเฟรชข้อมูลในหน้า
        toast('New Budget Created!');
     }
    }

  return (
    <div>
        
          <Dialog>
              <DialogTrigger asChild>
                  {trigger ? trigger : (
                    <div className='bg-slate-100 p-10 rounded-md 
                      items-center flex flex-col border-2 border-dashed
                      cursor-pointer hover:shadow-md'>
                        <h2 className='text-3xl'>+</h2>
                        <h2 className='font-bold'>Create New Budget</h2>
                    </div>
                  )}
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Create New Budget</DialogTitle>
                      <DialogDescription>
                        <div className='mt-5'>
                          <input
                            ref={receiptInputRef}
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={handleReceiptSelection}
                          />
                          <Button
                            type='button'
                            onClick={() => receiptInputRef.current?.click()}
                            disabled={scanLoading}
                            className='w-full mb-3 bg-linear-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 cursor-pointer text-white'
                          >
                            {scanLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <ScanLine className='h-4 w-4 mr-2' />}
                            {scanLoading ? 'Scanning Receipt...' : 'Scan Receipt with AI'}
                          </Button>
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
                            autoComplete="on"
                            value={name || ''}
                            onChange={(e)=>setName(e.target.value)}/>
                          </div>
                          <div className='mt-2'>
                            <h2 className='text-black font-medium my-1'>Budget Amount</h2>
                            <Input 
                            type="number"
                            placeholder="e.g. 5000฿"
                            autoComplete="on"
                            value={amount || ''}
                            onChange={(e)=>setAmount(e.target.value)}/>
                          </div>

                          
                        </div>
                      </DialogDescription>
                  </DialogHeader>
                    <DialogFooter className="sm:justify-start">
                      <DialogClose asChild>
                        <Button 
                            disabled={!(name&&amount)}
                            onClick={()=>onCreateBudget()}
                          className="mt-5 w-full bg-amber-600
                           hover:bg-amber-700 cursor-pointer">
                            Create Budget
                        </Button>
                      </DialogClose>
                    </DialogFooter>
              </DialogContent>
          </Dialog>

    </div>
  )
}

export default CreateBudget