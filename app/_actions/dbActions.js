"use server" // บอก Next.js ว่าให้รันโค้ดนี้ที่ Server เท่านั้น

import { db } from '@/utils/dbConfig'
import { AdminAlerts, AdminAuditLogs, Budgets, Expenses } from '@/utils/schema'
import { currentUser } from '@clerk/nextjs/server'
import { eq, sql, desc, inArray, and } from 'drizzle-orm'
import { toDateValue, toMoneyNumber } from '@/lib/dataNormalization'
import { getSecurityTelemetrySnapshot } from '@/lib/securityTelemetry'

const toIsoDateTime = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString();
}

const getCurrentActorEmail = async () => {
    const user = await currentUser();
    return String(user?.primaryEmailAddress?.emailAddress || '').toLowerCase() || null;
}

const createAdminAuditLogEntry = async ({ action, targetType, targetCount, message }) => {
    try {
        const actorEmail = await getCurrentActorEmail();
        await db.insert(AdminAuditLogs).values({
            action,
            targetType,
            targetCount: Number(targetCount || 0),
            message,
            actorEmail,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error creating admin audit log:', error);
    }
}




export async function checkUserBudgetsAction(email) {
  if (!email) return [];
  const result = await db.select()
    .from(Budgets)
    .where(eq(Budgets.createdBy, email));
  return result;
}

export async function createBudgetAction(data) {
    try {
        const normalizedAmount = toMoneyNumber(data.amount)
        if (normalizedAmount === null) {
            return { error: "Invalid budget amount" }
        }

        const result = await db.insert(Budgets)
            .values({
                name: data.name,
                amount: normalizedAmount,
                createdBy: data.createdBy,
                icon: data.icon,
                category: data.category || null,
            })
            .returning({insertedId:Budgets.id}); // ส่งค่าที่บันทึกสำเร็จกลับมา

        await createAdminAuditLogEntry({
            action: 'create_budget',
            targetType: 'budget',
            targetCount: result.length,
            message: `Created budget ${data.name}`,
        });

        return result;
    } catch (error) {
        console.error("Error creating budget:", error);
        return { error: "Failed to create budget" };
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
            category: Budgets.category,
            createdBy: Budgets.createdBy,
            totalSpend: sql`coalesce(sum(${Expenses.amount}), 0)`.mapWith(Number),
            totalItem: sql`coalesce(count(${Expenses.id}), 0)`.mapWith(Number),
        })
        .from(Budgets)
        .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(and(eq(Budgets.createdBy, email), eq(Budgets.id, budgetId)))
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
        const normalizedAmount = toMoneyNumber(data.amount)
        if (normalizedAmount === null) {
            return { error: 'Invalid expense amount' }
        }

        const normalizedDate = toDateValue(data.createdAt) || new Date();

        const result = await db.insert(Expenses).values({
            name: data.name,
            amount: normalizedAmount,
                budgetId: data.budgetId,
                category: data.category || null,
            createdAt: normalizedDate
        }).returning({ insertedId: Expenses.id });

        await createAdminAuditLogEntry({
            action: 'create_expense',
            targetType: 'expense',
            targetCount: result.length,
            message: `Created expense ${data.name}`,
        });

        return result;
    } catch (error) {
        console.error("Error adding expense:", error);
        return null;
    }
}

export async function addBulkExpensesAction(payload) {
    try {
        const budgetId = Number(payload?.budgetId);
        const category = String(payload?.category || '').trim() || null;
        const createdAt = toDateValue(payload?.createdAt) || new Date();
        const rawItems = Array.isArray(payload?.items) ? payload.items : [];

        if (!budgetId || rawItems.length === 0) {
            return { success: false, error: 'Missing bulk expense data' };
        }

        const values = rawItems
            .map((item) => ({
                name: String(item?.name || '').trim(),
                amount: toMoneyNumber(item?.amount),
            }))
            .filter((item) => item.name && item.amount !== null)
            .slice(0, 100)
            .map((item) => ({
                name: item.name,
                amount: item.amount,
                budgetId,
                category,
                createdAt,
            }));

        if (values.length === 0) {
            return { success: false, error: 'No valid items to add' };
        }

        const inserted = await db.insert(Expenses).values(values).returning({ id: Expenses.id });

        await createAdminAuditLogEntry({
            action: 'bulk_create_expense',
            targetType: 'expense',
            targetCount: inserted.length,
            message: `Created ${inserted.length} expenses from receipt scan`,
        });

        return { success: true, count: inserted.length };
    } catch (error) {
        console.error('Error adding bulk expenses:', error);
        return { success: false, error: 'Failed to add scanned items' };
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

            // console.log("Expenses List:", result);
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

        await createAdminAuditLogEntry({
            action: 'delete_expense',
            targetType: 'expense',
            targetCount: result.length,
            message: `Deleted ${result.length} expense record`,
        });

        return result;
    } catch (error) {
        console.error("Error deleting expense:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับแก้ไข Expense
export async function updateExpenseAction(expenseId, data) {
    try {
        const normalizedAmount = toMoneyNumber(data.amount)
        if (normalizedAmount === null) {
            return { error: 'Invalid expense amount' }
        }

        const normalizedDate = toDateValue(data.createdAt);

        const result = await db.update(Expenses).set({
            name: data.name,
            amount: normalizedAmount,
            category: data.category || null,
            createdAt: normalizedDate || new Date(),
        }).where(eq(Expenses.id, expenseId)).returning();

        await createAdminAuditLogEntry({
            action: 'update_expense',
            targetType: 'expense',
            targetCount: result.length,
            message: `Updated expense ${data.name}`,
        });

        return result;
    } catch (error) {
        console.error("Error updating expense:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับลบ Budget
export async function deleteBudgetAction(budgetId) {
    try {
        // ลบ Expenses ที่เกี่ยวข้องกับ Budget นี้ก่อน
        const deletedExpenses = await db.delete(Expenses)
            .where(eq(Expenses.budgetId, budgetId))
            .returning();

        // จากนั้นลบ Budget
        const result = await db.delete(Budgets)
            .where(eq(Budgets.id, budgetId))
            .returning();

        await createAdminAuditLogEntry({
            action: 'delete_budget',
            targetType: 'budget',
            targetCount: result.length,
            message: `Deleted budget ${budgetId} and ${deletedExpenses.length} related expenses`,
        });
        
        return result;
    } catch (error) {
        console.error("Error deleting budget:", error);
        return null;
    }
}

// ✅ ฟังก์ชันสำหรับแก้ Budget
export async function updateBudgetAction(budgetInfo, name, amount, emojiIcon, category) {
    try {
        const normalizedAmount = toMoneyNumber(amount)
        if (normalizedAmount === null) {
            return { error: 'Invalid budget amount' }
        }

        const result = await db.update(Budgets).set({
            name:name,
            amount:normalizedAmount,
            icon: emojiIcon || budgetInfo?.icon || '😀',
            category: category || null,
        }).where(eq(Budgets.id, budgetInfo.id))
        .returning();

        await createAdminAuditLogEntry({
            action: 'update_budget',
            targetType: 'budget',
            targetCount: result.length,
            message: `Updated budget ${name}`,
        });

        return result;
    } catch (error) {
        console.error("Error updating budget:", error);
        return null;
    }
}

export async function syncBudgetCategoryToExpensesAction(budgetId, category) {
    try {
        const parsedBudgetId = Number(budgetId);
        const nextCategory = String(category || '').trim();

        if (!parsedBudgetId) {
            return { success: false, error: 'Invalid budget id' };
        }

        if (!nextCategory) {
            return { success: false, error: 'Please set default category first' };
        }

        // Keep budget default category in sync so Edit dialog shows current value after refresh.
        await db.update(Budgets)
            .set({ category: nextCategory })
            .where(eq(Budgets.id, parsedBudgetId));

        const updated = await db.update(Expenses)
            .set({ category: nextCategory })
            .where(eq(Expenses.budgetId, parsedBudgetId))
            .returning({ id: Expenses.id });

        return { success: true, count: updated.length };
    } catch (error) {
        console.error('Error syncing budget category to expenses:', error);
        return { success: false, error: 'Failed to sync category to expenses' };
    }
}

// ✅ ฟังก์ชันสำหรับดึงรายการ Budget ตาม Email
export const getBudgetListAction = async (email) => {
  if (!email) return [];

  try {
    const result = await db.select({
      id: Budgets.id,
      name: Budgets.name,
      amount: Budgets.amount,
      icon: Budgets.icon, // <--- ตรวจสอบว่าใน Schema ตั้งชื่อว่า icon ใช่ไหม
            category: Budgets.category,
      createdBy: Budgets.createdBy,
        totalSpend: sql`coalesce(sum(${Expenses.amount}), 0)`.mapWith(Number),
      totalItem: sql`coalesce(count(${Expenses.id}), 0)`.mapWith(Number),
    })
    .from(Budgets)
    .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
    .where(eq(Budgets.createdBy, email))
    .groupBy(Budgets.id)
    .orderBy(desc(Budgets.id));

    getAllExpensesAction();

    return result;
  } catch (error) {
    console.error("Error fetching budget list:", error);
    return [];
  }
}

export async function getAdminMonitoringDashboardAction() {
    try {
        const telemetry = getSecurityTelemetrySnapshot();
        const hasServerDbUrl = Boolean(process.env.DATABASE_URL);
        const hasPublicDbUrl = Boolean(process.env.NEXT_PUBLIC_DATABASE_URL);
        const hasServerAdminAllowlist = Boolean(process.env.ADMIN_EMAILS);
        const hasPublicAdminAllowlist = Boolean(process.env.NEXT_PUBLIC_ADMIN_EMAILS);
        const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || '');
        const httpsReady = process.env.NODE_ENV !== 'production' || appUrl.startsWith('https://');

        const [storedAlerts, auditRows] = await Promise.all([
            db.select().from(AdminAlerts).orderBy(desc(AdminAlerts.id)),
            db.select().from(AdminAuditLogs).orderBy(desc(AdminAuditLogs.id)),
        ]);

        const rows = await db.select({
            budgetId: Budgets.id,
            budgetName: Budgets.name,
            budgetAmount: Budgets.amount,
            createdBy: Budgets.createdBy,
            expenseId: Expenses.id,
            expenseName: Expenses.name,
            expenseAmount: Expenses.amount,
            expenseCategory: Expenses.category,
            expenseDate: Expenses.createdAt,
        })
        .from(Budgets)
        .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .orderBy(desc(Budgets.id), desc(Expenses.id));

        const uniqueBudgetIds = new Set();
        const uniqueUsers = new Set();
        const expenseRows = [];
        const budgetSpendById = new Map();
        const budgetAmountById = new Map();

        for (const row of rows) {
            if (row.budgetId) uniqueBudgetIds.add(row.budgetId);
            if (row.createdBy) uniqueUsers.add(String(row.createdBy).toLowerCase());

            const budgetAmount = Number(row.budgetAmount || 0);
            if (row.budgetId && !budgetAmountById.has(row.budgetId)) {
                budgetAmountById.set(row.budgetId, budgetAmount);
            }

            if (row.expenseId) {
                const amount = Number(row.expenseAmount || 0);
                expenseRows.push({
                    id: row.expenseId,
                    name: row.expenseName,
                    amount,
                    category: row.expenseCategory,
                    createdAt: toIsoDateTime(row.expenseDate),
                    budgetId: row.budgetId,
                    createdBy: row.createdBy,
                });
                const prev = budgetSpendById.get(row.budgetId) || 0;
                budgetSpendById.set(row.budgetId, prev + amount);
            }
        }

        const totalSpend = expenseRows.reduce((sum, row) => sum + row.amount, 0);
        const totalExpenses = expenseRows.length;
        const avgExpense = totalExpenses > 0 ? totalSpend / totalExpenses : 0;

        const missingCategory = expenseRows.filter((row) => !String(row.category || '').trim()).length;
        const invalidAmount = expenseRows.filter((row) => Number(row.amount || 0) <= 0).length;

        const duplicateTracker = new Map();
        let duplicateCount = 0;
        for (const row of expenseRows) {
            const key = [
                String(row.name || '').trim().toLowerCase(),
                Number(row.amount || 0).toFixed(2),
                String(row.createdAt || '').trim(),
                Number(row.budgetId || 0),
            ].join('|');
            const seen = duplicateTracker.get(key) || 0;
            duplicateTracker.set(key, seen + 1);
            if (seen >= 1) duplicateCount += 1;
        }

        let budgetsOverLimit = 0;
        for (const [budgetId, amount] of budgetAmountById.entries()) {
            const spent = budgetSpendById.get(budgetId) || 0;
            if (spent > amount) budgetsOverLimit += 1;
        }

        const thisMonthKey = new Date().toISOString().slice(0, 7);
        const txThisMonth = expenseRows.filter((row) => {
            const dateValue = row.createdAt ? new Date(row.createdAt) : null;
            if (!dateValue || Number.isNaN(dateValue.getTime())) return false;
            return dateValue.toISOString().slice(0, 7) === thisMonthKey;
        }).length;

        const alertStates = storedAlerts.reduce((acc, row) => {
            const key = String(row.alertKey || '').trim();
            if (!key || acc[key]) return acc;
            acc[key] = row.status === 'acknowledged';
            return acc;
        }, {});

        const securityChecks = [
            {
                id: 'headers-enabled',
                label: 'Security headers enabled globally',
                status: 'pass',
                detail: 'Configured in next.config.mjs (HSTS, X-Frame-Options, nosniff).',
            },
            {
                id: 'db-url-server-only',
                label: 'Database URL is server-side only',
                status: hasServerDbUrl && !hasPublicDbUrl ? 'pass' : 'fail',
                detail: hasServerDbUrl && !hasPublicDbUrl
                    ? 'Using DATABASE_URL only.'
                    : 'Use DATABASE_URL and remove NEXT_PUBLIC_DATABASE_URL.',
            },
            {
                id: 'admin-allowlist-server-only',
                label: 'Admin allowlist is server-side only',
                status: hasServerAdminAllowlist && !hasPublicAdminAllowlist ? 'pass' : 'warn',
                detail: hasServerAdminAllowlist && !hasPublicAdminAllowlist
                    ? 'Using ADMIN_EMAILS only.'
                    : 'Avoid exposing admin allowlist in NEXT_PUBLIC_ADMIN_EMAILS.',
            },
            {
                id: 'api-key-server-only',
                label: 'API keys present only on server',
                status: process.env.OPENROUTER_API_KEY ? 'pass' : 'fail',
                detail: process.env.OPENROUTER_API_KEY
                    ? 'OPENROUTER_API_KEY detected on server environment.'
                    : 'Missing OPENROUTER_API_KEY in server environment.',
            },
            {
                id: 'https-prod-ready',
                label: 'Production app URL uses HTTPS',
                status: httpsReady ? 'pass' : 'warn',
                detail: httpsReady
                    ? 'APP URL is ready for secure cookie + HSTS behavior.'
                    : 'Set NEXT_PUBLIC_APP_URL to https://... in production.',
            },
        ];

        const failedChecks = securityChecks.filter((item) => item.status === 'fail').length;
        const warningChecks = securityChecks.filter((item) => item.status === 'warn').length;

        return {
            overview: {
                totalUsers: uniqueUsers.size,
                totalBudgets: uniqueBudgetIds.size,
                totalExpenses,
                totalSpend,
                avgExpense,
            },
            monitoring: {
                missingCategory,
                invalidAmount,
                duplicateCount,
                budgetsOverLimit,
                txThisMonth,
            },
            budgetRows: rows
                .filter((row) => row.budgetId)
                .reduce((acc, row) => {
                    if (!acc.some((item) => item.id === row.budgetId)) {
                        acc.push({
                            id: row.budgetId,
                            name: row.budgetName,
                            amount: Number(row.budgetAmount || 0),
                            createdBy: row.createdBy,
                        });
                    }
                    return acc;
                }, []),
            expenseRows,
            alertStates,
            auditRows: auditRows.slice(0, 20).map((row) => ({
                ...row,
                createdAt: toIsoDateTime(row.createdAt),
            })),
            recentExpenses: expenseRows.slice(0, 10),
            security: {
                checks: securityChecks,
                failedChecks,
                warningChecks,
                telemetry,
            },
        };
    } catch (error) {
        console.error('Error fetching admin monitoring dashboard:', error);
        return {
            overview: { totalUsers: 0, totalBudgets: 0, totalExpenses: 0, totalSpend: 0, avgExpense: 0 },
            monitoring: { missingCategory: 0, invalidAmount: 0, duplicateCount: 0, budgetsOverLimit: 0, txThisMonth: 0 },
            budgetRows: [],
            expenseRows: [],
            alertStates: {},
            auditRows: [],
            recentExpenses: [],
            security: {
                checks: [],
                failedChecks: 0,
                warningChecks: 0,
                telemetry: {
                    receiptScan: {
                        activeClientCount: 0,
                        deniedTotal: 0,
                        acceptedTotal: 0,
                        lastDeniedAt: null,
                        limit: 5,
                        windowSeconds: 300,
                    },
                },
            },
        };
    }
}

export async function setAdminAlertStatusAction(alertKey, acknowledged) {
    try {
        const normalizedKey = String(alertKey || '').trim();
        if (!normalizedKey) {
            return { success: false, error: 'Missing alert key' };
        }

        const actorEmail = await getCurrentActorEmail();
        const existing = await db.select()
            .from(AdminAlerts)
            .where(eq(AdminAlerts.alertKey, normalizedKey))
            .orderBy(desc(AdminAlerts.id));

        const status = acknowledged ? 'acknowledged' : 'active';
        const payload = {
            status,
            acknowledgedAt: acknowledged ? new Date().toISOString() : null,
            acknowledgedBy: acknowledged ? actorEmail : null,
        };

        if (existing[0]) {
            await db.update(AdminAlerts)
                .set(payload)
                .where(eq(AdminAlerts.id, existing[0].id));
        } else {
            await db.insert(AdminAlerts).values({
                alertKey: normalizedKey,
                ...payload,
            });
        }

        await createAdminAuditLogEntry({
            action: acknowledged ? 'alert_acknowledged' : 'alert_reopened',
            targetType: 'alert',
            targetCount: 1,
            message: `${acknowledged ? 'Acknowledged' : 'Re-opened'} alert ${normalizedKey}`,
        });

        return { success: true };
    } catch (error) {
        console.error('Error setting admin alert status:', error);
        return { success: false, error: 'Failed to update alert status' };
    }
}

export async function getAdminUsersSummaryAction() {
    try {
        const rows = await db.select({
            createdBy: Budgets.createdBy,
            budgetId: Budgets.id,
            budgetAmount: Budgets.amount,
            expenseId: Expenses.id,
            expenseAmount: Expenses.amount,
        })
        .from(Budgets)
        .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId));

        const userMap = new Map();

        for (const row of rows) {
            const email = String(row.createdBy || '').toLowerCase();
            if (!email) continue;

            if (!userMap.has(email)) {
                userMap.set(email, {
                    email,
                    budgets: new Set(),
                    expenses: 0,
                    totalBudget: 0,
                    totalSpend: 0,
                });
            }

            const entry = userMap.get(email);

            if (row.budgetId && !entry.budgets.has(row.budgetId)) {
                entry.budgets.add(row.budgetId);
                entry.totalBudget += Number(row.budgetAmount || 0);
            }

            if (row.expenseId) {
                entry.expenses += 1;
                entry.totalSpend += Number(row.expenseAmount || 0);
            }
        }

        return Array.from(userMap.values())
            .map((entry) => ({
                email: entry.email,
                budgets: entry.budgets.size,
                expenses: entry.expenses,
                totalBudget: entry.totalBudget,
                totalSpend: entry.totalSpend,
            }))
            .sort((a, b) => b.totalSpend - a.totalSpend);
    } catch (error) {
        console.error('Error fetching admin users summary:', error);
        return [];
    }
}

export async function getAdminUserDetailAction(email) {
    try {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (!normalizedEmail) return null;

        const budgets = await db.select()
            .from(Budgets)
            .where(eq(Budgets.createdBy, normalizedEmail))
            .orderBy(desc(Budgets.id));

        const expenses = await db.select({
            id: Expenses.id,
            name: Expenses.name,
            amount: Expenses.amount,
            category: Expenses.category,
            createdAt: Expenses.createdAt,
            budgetId: Expenses.budgetId,
            budgetName: Budgets.name,
        })
        .from(Budgets)
        .rightJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(eq(Budgets.createdBy, normalizedEmail))
        .orderBy(desc(Expenses.id));

        const totalBudget = budgets.reduce((sum, row) => sum + Number(row.amount || 0), 0);
        const totalSpend = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);

        return {
            email: normalizedEmail,
            summary: {
                budgets: budgets.length,
                expenses: expenses.length,
                totalBudget,
                totalSpend,
            },
            recentExpenses: expenses.slice(0, 12).map((row) => ({
                ...row,
                createdAt: toIsoDateTime(row.createdAt),
            })),
        };
    } catch (error) {
        console.error('Error fetching admin user detail:', error);
        return null;
    }
}

export async function getAdminDatabaseManagementAction() {
    try {
        const [budgetRows, expenseRows, alertRows, auditRows] = await Promise.all([
            db.select({
                id: Budgets.id,
                name: Budgets.name,
                amount: Budgets.amount,
                icon: Budgets.icon,
                category: Budgets.category,
                createdBy: Budgets.createdBy,
                totalSpend: sql`coalesce(sum(${Expenses.amount}), 0)`.mapWith(Number),
                totalItem: sql`coalesce(count(${Expenses.id}), 0)`.mapWith(Number),
            })
            .from(Budgets)
            .leftJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
            .groupBy(Budgets.id)
            .orderBy(desc(Budgets.id)),

            db.select({
                id: Expenses.id,
                name: Expenses.name,
                amount: Expenses.amount,
                category: Expenses.category,
                createdAt: Expenses.createdAt,
                budgetId: Expenses.budgetId,
                budgetName: Budgets.name,
                createdBy: Budgets.createdBy,
            })
            .from(Budgets)
            .rightJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
            .orderBy(desc(Expenses.id)),

            db.select().from(AdminAlerts).orderBy(desc(AdminAlerts.id)),
            db.select().from(AdminAuditLogs).orderBy(desc(AdminAuditLogs.id)),
        ]);

        const uniqueUsers = new Set(
            budgetRows.map((row) => String(row.createdBy || '').toLowerCase()).filter(Boolean)
        );

        const activeAlerts = alertRows.filter((row) => row.status !== 'acknowledged').length;
        const normalizedExpenses = expenseRows.map((row) => ({
            ...row,
            createdAt: toIsoDateTime(row.createdAt),
        }));
        const normalizedAlerts = alertRows.map((row) => ({
            ...row,
            acknowledgedAt: toIsoDateTime(row.acknowledgedAt),
        }));
        const normalizedAuditRows = auditRows.map((row) => ({
            ...row,
            createdAt: toIsoDateTime(row.createdAt),
        }));

        return {
            summary: {
                users: uniqueUsers.size,
                budgets: budgetRows.length,
                expenses: normalizedExpenses.length,
                activeAlerts,
                auditEvents: normalizedAuditRows.length,
            },
            tableCounts: {
                budgets: budgetRows.length,
                expenses: normalizedExpenses.length,
                alerts: normalizedAlerts.length,
                audit: normalizedAuditRows.length,
            },
            budgets: budgetRows,
            expenses: normalizedExpenses,
            alerts: normalizedAlerts,
            auditLogs: normalizedAuditRows,
        };
    } catch (error) {
        console.error('Error fetching admin database management data:', error);
        return {
            summary: {
                users: 0,
                budgets: 0,
                expenses: 0,
                activeAlerts: 0,
                auditEvents: 0,
            },
            tableCounts: {
                budgets: 0,
                expenses: 0,
                alerts: 0,
                audit: 0,
            },
            budgets: [],
            expenses: [],
            alerts: [],
            auditLogs: [],
        };
    }
}

export async function adminBulkSetCategoryAction(expenseIds, categoryName) {
    try {
        const ids = Array.isArray(expenseIds)
            ? expenseIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
            : [];

        const category = String(categoryName || '').trim();
        if (ids.length === 0 || !category) {
            return { success: false, count: 0, error: 'Missing update parameters' };
        }

        const updated = await db.update(Expenses)
            .set({ category })
            .where(inArray(Expenses.id, ids))
            .returning({ id: Expenses.id });

        await createAdminAuditLogEntry({
            action: 'bulk_set_category',
            targetType: 'expense',
            targetCount: updated.length,
            message: `Set category to ${category} for ${updated.length} expense records`,
        });

        return { success: true, count: updated.length };
    } catch (error) {
        console.error('Error bulk setting category:', error);
        return { success: false, count: 0, error: 'Failed to update categories' };
    }
}

export async function adminBulkDeleteExpensesAction(expenseIds) {
    try {
        const ids = Array.isArray(expenseIds)
            ? expenseIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
            : [];

        if (ids.length === 0) {
            return { success: false, count: 0, error: 'No expense ids provided' };
        }

        const deleted = await db.delete(Expenses)
            .where(inArray(Expenses.id, ids))
            .returning({ id: Expenses.id });

        await createAdminAuditLogEntry({
            action: 'bulk_delete_expenses',
            targetType: 'expense',
            targetCount: deleted.length,
            message: `Deleted ${deleted.length} expense records from admin workbench`,
        });

        return { success: true, count: deleted.length };
    } catch (error) {
        console.error('Error bulk deleting expenses:', error);
        return { success: false, count: 0, error: 'Failed to delete expenses' };
    }
}


// ✅ ฟังก์ชันสำหรับดึงรายการค่าใช้จ่าย (Expenses) ทั้งหมด ของผู้ใช้ตาม Email (สำหรับหน้า Dashboard)
export async function getAllExpensesAction(email) {
    if (!email) return [];
    try {
        const result = await db.select({
            id: Expenses.id,
            name: Expenses.name,
            amount: Expenses.amount,
            createdAt: Expenses.createdAt,
            budgetId: Expenses.budgetId,
                category: Expenses.category,
            budgetName: Budgets.name,
        }).from(Budgets)
        .rightJoin(Expenses, eq(Budgets.id, Expenses.budgetId))
        .where(eq(Budgets.createdBy, email))
        .orderBy(desc(Expenses.id));

        // console.log("All Expenses Data:", result);
        return result;
    } catch (error) {
        console.error("Error fetching all expenses:", error);
        return [];
    }
}

