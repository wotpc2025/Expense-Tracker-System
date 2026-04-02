import { int, decimal, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const Budgets=mysqlTable('budgets',{
    id:int('id').autoincrement().primaryKey(),
    name:varchar('name', { length: 255 }).notNull(),
    amount:decimal('amount', { precision: 12, scale: 2 }).notNull(),
    icon:varchar('icon', { length: 255 }),
    category:varchar('category', { length: 255 }),
    createdBy:varchar('createdBy', { length: 255 }).notNull()
})

export const Expenses=mysqlTable('expenses',{
    id:int('id').autoincrement().primaryKey(),
    name:varchar('name', { length: 255 }).notNull(),
    amount:decimal('amount', { precision: 12, scale: 2 }).notNull(),
    budgetId:int('budgetId').references(()=>Budgets.id),
    category:varchar('category', { length: 255 }),
    createdAt:timestamp('createdAt').defaultNow().notNull()
})

export const AdminAlerts = mysqlTable('admin_alerts', {
    id: int('id').autoincrement().primaryKey(),
    alertKey: varchar('alertKey', { length: 255 }).notNull(),
    status: varchar('status', { length: 255 }).notNull(),
    acknowledgedAt: timestamp('acknowledgedAt'),
    acknowledgedBy: varchar('acknowledgedBy', { length: 255 }),
})

export const AdminAuditLogs = mysqlTable('admin_audit_logs', {
    id: int('id').autoincrement().primaryKey(),
    action: varchar('action', { length: 255 }).notNull(),
    targetType: varchar('targetType', { length: 255 }).notNull(),
    targetCount: int('targetCount').notNull(),
    message: varchar('message', { length: 500 }).notNull(),
    actorEmail: varchar('actorEmail', { length: 255 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
})