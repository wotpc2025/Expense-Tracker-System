import { integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const Budgets=pgTable('budgets',{
    id:serial('id').primaryKey(),
    name:varchar('name').notNull(),
    amount:varchar('amount').notNull(),
    icon:varchar('icon'),
    category:varchar('category'),
    createdBy:varchar('createdBy').notNull()
})

export const Expenses=pgTable('expenses',{
    id:serial('id').primaryKey(),
    name:varchar('name').notNull(),
    amount:varchar('amount').notNull(),    
    budgetId:integer('budgetId').references(()=>Budgets.id),
    category:varchar('category'),
    createdAt:varchar('createdAt').notNull()
})