"use server" // บอก Next.js ว่าให้รันโค้ดนี้ที่ Server เท่านั้น

import { db } from '@/utils/dbConfig'
import { Budgets } from '@/utils/schema'
import { eq } from 'drizzle-orm'


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