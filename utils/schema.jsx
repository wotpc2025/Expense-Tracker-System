import { integer, numeric, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const Budgets=pgTable('budgets',{
    id:serial('id').primaryKey(),
    name:varchar('name').notNull(),
    amount:numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    icon:varchar('icon'),
    category:varchar('category'),
    createdBy:varchar('createdBy').notNull()
})

export const Expenses=pgTable('expenses',{
    id:serial('id').primaryKey(),
    name:varchar('name').notNull(),
    amount:numeric('amount', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    budgetId:integer('budgetId').references(()=>Budgets.id),
    category:varchar('category'),
    createdAt:timestamp('createdAt', { withTimezone: true }).defaultNow().notNull()
})

export const AdminAlerts = pgTable('admin_alerts', {
    id: serial('id').primaryKey(),
    alertKey: varchar('alertKey').notNull(),
    status: varchar('status').notNull(),
    acknowledgedAt: timestamp('acknowledgedAt', { withTimezone: true }),
    acknowledgedBy: varchar('acknowledgedBy'),
})

export const AdminAuditLogs = pgTable('admin_audit_logs', {
    id: serial('id').primaryKey(),
    action: varchar('action').notNull(),
    targetType: varchar('targetType').notNull(),
    targetCount: integer('targetCount').notNull(),
    message: varchar('message').notNull(),
    actorEmail: varchar('actorEmail'),
    createdAt: timestamp('createdAt', { withTimezone: true }).defaultNow().notNull(),
})