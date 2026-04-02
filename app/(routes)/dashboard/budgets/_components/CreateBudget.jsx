
"use client"



import React, { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useUser } from '@clerk/nextjs'
import { createBudgetAction } from '@/app/_actions/dbActions'
import { toast } from 'sonner'
import { CheckCircle2, Loader, ScanLine, Sparkles } from 'lucide-react'
import AddExpense from '../../expenses/_components/AddExpense'
import { suggestEmoji } from '@/lib/budgetEmojiSuggest'
import { getTranslation } from '@/lib/translations'
import { useLanguage } from '@/app/(routes)/dashboard/_providers/LanguageProvider'

function CreateBudget({ refreshData, trigger }) {
        const getScannedTotal = (scanResult) => {
            if (!scanResult || !Array.isArray(scanResult.lineItems)) return ''
            const total = scanResult.lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
            return total ? String(total) : ''
        }

        // Toggle autoAmount and set amount from scan result if enabled
        const handleAutoAmountChange = (checked) => {
            setAutoAmount(checked);
            if (checked) {
                setAmount(getScannedTotal(initialScanResult));
            }
        };
    const { language } = useLanguage();
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState('create') // 'create' | 'addExpense'
    const [emojiIcon, setEmojiIcon] = useState('😀')
    const [emojiAutoSet, setEmojiAutoSet] = useState(false) // true = emoji was auto-suggested
    const [openEmojiPicker, setOpenEmojiPicker] = useState(false)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [autoAmount, setAutoAmount] = useState(false) // true = ใช้ยอดจาก AI
    const [loading, setLoading] = useState(false)
    const [scanLoading, setScanLoading] = useState(false)
    const [initialScanResult, setInitialScanResult] = useState(null)
    const [createdBudget, setCreatedBudget] = useState(null)
    const receiptInputRef = useRef(null)
    const pickerRef = useRef(null)

    const { user } = useUser()

    // Auto-suggest emoji from budget name
    useEffect(() => {
        const suggested = suggestEmoji(name)
        if (suggested) {
            setEmojiIcon(suggested)
            setEmojiAutoSet(true)
        } else if (emojiAutoSet) {
            // name cleared — reset to default only if it was auto-set
            setEmojiIcon('😀')
            setEmojiAutoSet(false)
        }
    }, [name])

    // Close picker on outside click
    useEffect(() => {
        if (!openEmojiPicker) return
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setOpenEmojiPicker(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [openEmojiPicker])

    useEffect(() => {
        if (!autoAmount) return
        setAmount(getScannedTotal(initialScanResult))
    }, [autoAmount, initialScanResult])

    const resetForm = () => {
        setStep('create')
        setEmojiIcon('😀')
        setEmojiAutoSet(false)
        setOpenEmojiPicker(false)
        setName('')
        setAmount('')
        setLoading(false)
        setScanLoading(false)
        setInitialScanResult(null)
        setCreatedBudget(null)
    }

    const handleReceiptScan = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return
        try {
            setScanLoading(true)
            const formData = new FormData()
            formData.append('receipt', file)
            const response = await fetch('/api/ai/scan-receipt', { method: 'POST', body: formData })
            const result = await response.json()
            if (!response.ok) {
                toast.error(result?.userMessage || result?.error || 'สแกนใบเสร็จไม่สำเร็จ')
                return
            }
            setInitialScanResult(result)
            toast.success(
                Array.isArray(result?.lineItems) && result.lineItems.length > 0
                    ? `สแกนสำเร็จ พบ ${result.lineItems.length} รายการ — กรอกชื่อ Budget แล้วกด Create Budget`
                    : 'สแกนใบเสร็จสำเร็จ — กรอกชื่อ Budget แล้วกด Create Budget'
            )
        } catch {
            toast.error('สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        } finally {
            setScanLoading(false)
            if (receiptInputRef.current) receiptInputRef.current.value = ''
        }
    }

    const onCreateBudget = async () => {
        setLoading(true)
        try {
            const result = await createBudgetAction({
                name,
                amount,
                createdBy: user?.primaryEmailAddress?.emailAddress,
                icon: emojiIcon,
            })
            if (result && result[0]?.insertedId) {
                refreshData && refreshData()
                toast.success('New Budget Created!')
                setCreatedBudget({ id: result[0].insertedId, name, icon: emojiIcon })
                setStep('addExpense')
            }
        } catch (error) {
            console.error('Create budget error:', error)
            toast.error('สร้าง Budget ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger asChild onClick={() => setOpen(true)}>
                {trigger ? trigger : (
                    <div className='bg-slate-100 p-10 rounded-md items-center flex flex-col border-2 border-dashed cursor-pointer hover:shadow-md'>
                        <h2 className='text-3xl'>+</h2>
                        <h2 className='font-bold'>{getTranslation(language, 'createBudget.title')}</h2>
                    </div>
                )}
            </DialogTrigger>

            <DialogContent className={step === 'addExpense' ? 'sm:max-w-xl max-h-[90vh] overflow-y-auto' : 'sm:max-w-md'}>

                {/* Step indicator */}
                <div className='flex items-center gap-2 text-xs'>
                    <span className={`flex items-center gap-1.5 font-semibold ${step === 'create' ? 'text-amber-600' : 'text-slate-400'}`}>
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'create' ? 'bg-amber-600 text-white' : 'bg-emerald-500 text-white'}`}>
                            {step === 'create' ? '1' : <CheckCircle2 className='h-3.5 w-3.5' />}
                        </span>
                        Create Budget
                    </span>
                    <span className='text-slate-300 select-none'>→</span>
                    <span className={`flex items-center gap-1.5 font-semibold ${step === 'addExpense' ? 'text-amber-600' : 'text-slate-400'}`}>
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'addExpense' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</span>
                        Add Expenses
                    </span>
                </div>

                {/* ─── Step 1: Create Budget ─── */}
                {step === 'create' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{getTranslation(language, 'createBudget.title')}</DialogTitle>
                        </DialogHeader>
                        <div className='mt-1'>
                            {/* Emoji button with auto-suggest badge */}
                            <div className='relative inline-flex items-end gap-1'>
                                <Button
                                    variant="outline"
                                    className="cursor-pointer text-2xl h-12 w-12 p-0 relative"
                                    onClick={() => setOpenEmojiPicker(!openEmojiPicker)}
                                    title={emojiAutoSet ? getTranslation(language, 'createBudget.emojiAutoSuggested') : getTranslation(language, 'createBudget.emojiPick')}
                                >
                                    {emojiIcon}
                                </Button>
                                {emojiAutoSet && (
                                    <span className='flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 mb-0.5'>
                                        <Sparkles className='h-2.5 w-2.5' />AI
                                    </span>
                                )}
                            </div>
                            {/* @emoji-mart picker */}
                            {openEmojiPicker && (
                                <div ref={pickerRef} className='absolute z-50 mt-1 shadow-xl rounded-xl overflow-hidden'>
                                    <Picker
                                        data={data}
                                        onEmojiSelect={(e) => {
                                            setEmojiIcon(e.native)
                                            setEmojiAutoSet(false)
                                            setOpenEmojiPicker(false)
                                        }}
                                        theme='light'
                                        locale='en'
                                        previewPosition='none'
                                        skinTonePosition='search'
                                    />
                                </div>
                            )}
                            <div className='mt-3'>
                                <h2 className='text-black font-medium my-1 dark:text-white'>{getTranslation(language, 'createBudget.budgetName')}</h2>
                                <Input
                                    placeholder={getTranslation(language, 'placeholder.budgetName')}
                                    autoComplete="on"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className='mt-2'>
                                <h2 className='text-black font-medium my-1 dark:text-white'>{language === 'th' ? 'เป้าหมายงบประมาณ' : getTranslation(language, 'createBudget.budgetAmount')}</h2>
                                <div className='flex items-center gap-2 mb-2'>
                                    <Checkbox
                                        id="autoAmount"
                                        checked={autoAmount}
                                        onCheckedChange={handleAutoAmountChange}
                                        className={
                                            autoAmount
                                                ? "mr-1 cursor-pointer bg-amber-500 border-amber-500 text-white !data-[state=checked]:bg-amber-500 !data-[state=checked]:border-amber-500"
                                                : "mr-1 cursor-pointer"
                                        }
                                    />
                                    <span className='text-sm select-none'>{getTranslation(language, 'createBudget.autoFillFromScan')}</span>
                                </div>
                                <Input
                                    type="number"
                                    placeholder={getTranslation(language, 'placeholder.budgetAmount')}
                                    autoComplete="on"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={autoAmount}
                                    className={autoAmount ? 'opacity-60 pointer-events-none' : ''}
                                />
                                {autoAmount && (!initialScanResult || !Array.isArray(initialScanResult.lineItems) || initialScanResult.lineItems.length === 0) && (
                                    <div className='text-xs text-amber-600 mt-1'>โปรดสแกนใบเสร็จด้วย AI เพื่อดำเนินการสร้างงบประมาณ</div>
                                )}
                            </div>
                        </div>

                        {/* ── Scan Receipt ── */}
                        <input
                            ref={receiptInputRef}
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={handleReceiptScan}
                        />
                        <Button
                            type='button'
                            onClick={() => receiptInputRef.current?.click()}
                            disabled={scanLoading || loading}
                            className='w-full cursor-pointer bg-linear-to-r from-fuchsia-500 to-violet-500 text-white hover:from-fuchsia-600 hover:to-violet-600'
                        >
                            {scanLoading
                                ? <><Loader className='animate-spin mr-2 h-4 w-4' />{getTranslation(language, 'addExpense.scanning')}</>
                                : <><ScanLine className='mr-2 h-4 w-4' />{getTranslation(language, 'addExpense.scanReceipt')}</>}
                        </Button>

                        {/* Scan success badge */}
                        {initialScanResult && !scanLoading && (
                            <div className='flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2'>
                                <CheckCircle2 className='mt-0.5 h-4 w-4 shrink-0 text-emerald-500' />
                                <p className='text-xs text-emerald-700'>
                                    {Array.isArray(initialScanResult.lineItems) && initialScanResult.lineItems.length > 0
                                        ? <><span className='font-semibold'>พบ {initialScanResult.lineItems.length} รายการ</span>{' — '}กรอกข้อมูล Budget แล้วกด Create Budget เพื่อตรวจสอบ Expenses</>
                                        : <><span className='font-semibold'>สแกนสำเร็จ</span>{' — '}กรอกข้อมูล Budget แล้วกด Create Budget เพื่อเพิ่ม Expense</>}
                                </p>
                            </div>
                        )}

                        <Button
                            disabled={!(name && amount) || loading || scanLoading}
                            onClick={onCreateBudget}
                            className='w-full bg-amber-600 hover:bg-amber-700 cursor-pointer'
                        >
                            {loading
                                ? <Loader className='animate-spin' />
                                : initialScanResult
                                    ? getTranslation(language, 'createBudget.createAndReviewButton')
                                    : getTranslation(language, 'createBudget.createButton')}
                        </Button>
                    </>
                )}

                {/* ─── Step 2: Add Expenses ─── */}
                {step === 'addExpense' && createdBudget && (
                    <>
                        <DialogHeader>
                            <DialogTitle className='flex items-center gap-2'>
                                <CheckCircle2 className='h-5 w-5 text-emerald-500 shrink-0' />
                                {getTranslation(language, 'createBudget.toasts.createSuccess')}
                            </DialogTitle>
                            <p className='text-sm text-slate-500 mt-0.5'>
                                <span className='mr-1'>{createdBudget.icon}</span>
                                <span className='font-semibold text-slate-700'>{createdBudget.name}</span>
                                {' '}{initialScanResult ? 'ตรวจสอบและเพิ่ม Expense จากใบเสร็จได้เลย' : 'สร้างเรียบร้อยแล้ว — เพิ่ม Expense ได้เลย หรือกด Done เพื่อปิด'}
                            </p>
                        </DialogHeader>
                        <div className='mt-1'>
                            <AddExpense
                                budgetId={createdBudget.id}
                                initialCategory={createdBudget.name}
                                refreshData={refreshData}
                                density='comfortable'
                                initialScanResult={initialScanResult}
                            />
                        </div>
                        <Button
                            variant='outline'
                            className='mt-2 w-full cursor-pointer border-slate-300 text-slate-600 hover:bg-slate-50'
                            onClick={() => { setOpen(false); resetForm() }}
                        >
                            Done — ปิดหน้าต่างนี้
                        </Button>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}

export default CreateBudget