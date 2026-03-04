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