/**
 * schema.jsx — Drizzle ORM Table Definitions
 *
 * Defines all four database tables used by the Expense Tracker system.
 * These are imported in dbConfig.jsx (schema registration) and all Server
 * Actions in dbActions.js (type-safe query building).
 *
 * Table overview:
 *   Budgets       — user-created budget envelopes (1 row per budget)
 *   Expenses      — individual spending records linked to a budget
 *   AdminAlerts   — persistent alert acknowledgement state for the Admin panel
 *   AdminAuditLogs— immutable log of admin bulk operations
 *
 * All monetary columns use DECIMAL(12, 2) for precision.
 * Date/time columns default to the DB server's current timestamp.
 */
import { int, decimal, mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

// Budget master table: one row per user-defined budget envelope.
export const Budgets = mysqlTable('budgets', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    icon: varchar('icon', { length: 255 }),
    category: varchar('category', { length: 255 }),
    createdBy: varchar('createdBy', { length: 255 }).notNull()
})

// Expense transaction table: linked back to a budget via budgetId.
export const Expenses = mysqlTable('expenses', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    budgetId: int('budgetId').references(() => Budgets.id),
    category: varchar('category', { length: 255 }),
    createdAt: timestamp('createdAt').defaultNow().notNull()
})

// Persistent status table for admin alert acknowledgement workflow.
export const AdminAlerts = mysqlTable('admin_alerts', {
    id: int('id').autoincrement().primaryKey(),
    alertKey: varchar('alertKey', { length: 255 }).notNull(),
    status: varchar('status', { length: 255 }).notNull(),
    acknowledgedAt: timestamp('acknowledgedAt'),
    acknowledgedBy: varchar('acknowledgedBy', { length: 255 }),
})

// Immutable-ish admin audit trail for sensitive admin operations.
export const AdminAuditLogs = mysqlTable('admin_audit_logs', {
    id: int('id').autoincrement().primaryKey(),
    action: varchar('action', { length: 255 }).notNull(),
    targetType: varchar('targetType', { length: 255 }).notNull(),
    targetCount: int('targetCount').notNull(),
    message: varchar('message', { length: 500 }).notNull(),
    actorEmail: varchar('actorEmail', { length: 255 }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
})
