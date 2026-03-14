"use server" // บอก Next.js ว่าให้รันโค้ดนี้ที่ Server เท่านั้น

import { db } from '@/utils/dbConfig'
import { Budgets, Expenses } from '@/utils/schema'
import { eq, getTableColumns, sql, cast, desc } from 'drizzle-orm'
import { numeric } from 'drizzle-orm/pg-core'



export async function checkUserBudgetsAction(email) {
  if (!email) return [];
  const result = await db.select()
    .from(Budgets)
    .where(eq(Budgets.createdBy, email));
  return result;
}

export async function createBudgetAction(data) {
    try {
        const result = await db.insert(Budgets)
            .values({
                name: data.name,
                amount: data.amount,
                createdBy: data.createdBy,
                icon: data.icon
            })
            .returning({insertedId:Budgets.id}); // ส่งค่าที่บันทึกสำเร็จกลับมา
        return result;
    } catch (error) {
        console.error("Error creating budget:", error);
        return { error: "Failed to create budget" };
    }
}

export const getBudgetListAction = async (email) => {
  if (!email) return [];

  try {
    const result = await db.select({
      id: Budgets.id,
      name: Budgets.name,
      amount: Budgets.amount,
      icon: Budgets.icon, // <--- ตรวจสอบว่าใน Schema ตั้งชื่อว่า icon ใช่ไหม
      createdBy: Budgets.createdBy,
      totalSpend: sql`sum(CAST(${Expenses.amount} AS NUMERIC))`.mapWith(Number),
      totalItem: sql`coalesce(count(${Expenses.id}), 0)`.mapWith(Number),
    })
    .from(Budgets)
    .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
    .where(eq(Budgets.createdBy, email))
    .groupBy(Budgets.id)
    .orderBy(desc(Budgets.id));

    
    return result;
  } catch (error) {
    console.error("Error fetching budget list:", error);
    return [];
  }
}

// เพิ่มฟังก์ชันนี้เพื่อดึงข้อมูล Budget และยอดรวมในหน้า Expense
export async function getBudgetInfoAction(email, budgetId) {
    if (!email || !budgetId) return null;
    try {
        const result = await db.select({
            id: Budgets.id,
            name: Budgets.name,
            amount: Budgets.amount,
            icon: Budgets.icon,
            createdBy: Budgets.createdBy,
            totalSpend: sql`sum(CAST(${Expenses.amount} AS NUMERIC))`.mapWith(Number),
            totalItem: sql`coalesce(count(${Expenses.id}), 0)`.mapWith(Number),
        })
        .from(Budgets)
        .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(eq(Budgets.createdBy, email))
        .where(eq(Budgets.id, budgetId))
        .groupBy(Budgets.id);

        getExpensesListAction();

        return result[0] ? result[0] : null; // ส่งกลับเป็น Object ตัวเดียว
    } catch (error) {
        console.error("Error fetching budget info:", error);
        return null;
    }
}

// ✅ เพิ่มฟังก์ชันนี้สำหรับเพิ่ม Expense ใหม่
export async function addNewExpenseAction(data) {
    try {
        const result = await db.insert(Expenses).values({
            name: data.name,
            amount: data.amount,
            budgetId: data.budgetId,
            createdAt: data.createdAt // หรือใช้คำสั่ง sql`now()` ถ้าอยากได้เวลาปัจจุบันจาก DB
        }).returning({ insertedId: Expenses.id });

        return result;
    } catch (error) {
        console.error("Error adding expense:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับดึงรายการค่าใช้จ่าย (Expenses) ตาม ID ของ Budget
export const getExpensesListAction = async (budgetId) => {
    if (!budgetId) return [];

    try {
        const result = await db.select()
            .from(Expenses)
            .where(eq(Expenses.budgetId, budgetId))
            .orderBy(desc(Expenses.id));

            console.log("Expenses List:", result);
        return result;
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return [];
    }
}

// ✅ ฟังก์ชันสำหรับลบ Expense
export async function deleteExpenseAction(expenseId) {
    try {
        const result = await db.delete(Expenses)
            .where(eq(Expenses.id, expenseId))
            .returning();

        return result;
    } catch (error) {
        console.error("Error deleting expense:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับลบ Budget
export async function deleteBudgetAction(budgetId) {
    try {
        // ลบ Expenses ที่เกี่ยวข้องกับ Budget นี้ก่อน
        await db.delete(Expenses)
            .where(eq(Expenses.budgetId, budgetId))
            .returning();

        // จากนั้นลบ Budget
        const result = await db.delete(Budgets)
            .where(eq(Budgets.id, budgetId))
            .returning();
        
        return result;
    } catch (error) {
        console.error("Error deleting budget:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับแก้ Budget
export async function updateBudgetAction(budgetInfo, name, amount, emojiIcon) {
    try {
        const result = await db.update(Budgets).set({
            name:name,
            amount:amount,
            icon: emojiIcon || budgetInfo?.icon || '😀'
        }).where(eq(Budgets.id, budgetInfo.id))
        .returning();

        return result;
    } catch (error) {
        console.error("Error updating budget:", error);
        return null;
    }
}