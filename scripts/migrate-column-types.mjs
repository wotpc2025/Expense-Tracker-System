import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.NEXT_PUBLIC_DATABASE_URL;

if (!connectionString) {
  console.error('Missing NEXT_PUBLIC_DATABASE_URL in .env.local');
  process.exit(1);
}

const sql = postgres(connectionString);

const getColumnType = async (tableName, columnName) => {
  const rows = await sql`
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${tableName}
      and column_name = ${columnName}
    limit 1
  `;

  return rows[0]?.data_type || null;
};

const migrate = async () => {
  try {
    const budgetAmountType = await getColumnType('budgets', 'amount');
    if (budgetAmountType === 'character varying' || budgetAmountType === 'text') {
      await sql.unsafe(`
        alter table budgets
        alter column amount type numeric(12,2)
        using coalesce(nullif(regexp_replace(amount, '[^0-9.\\-]', '', 'g'), ''), '0')::numeric(12,2)
      `);
      console.log('Converted budgets.amount to numeric(12,2).');
    }

    const expenseAmountType = await getColumnType('expenses', 'amount');
    if (expenseAmountType === 'character varying' || expenseAmountType === 'text') {
      await sql.unsafe(`
        alter table expenses
        alter column amount type numeric(12,2)
        using coalesce(nullif(regexp_replace(amount, '[^0-9.\\-]', '', 'g'), ''), '0')::numeric(12,2)
      `);
      console.log('Converted expenses.amount to numeric(12,2).');
    }

    const expenseCreatedAtType = await getColumnType('expenses', 'createdAt');
    if (expenseCreatedAtType === 'character varying' || expenseCreatedAtType === 'text') {
      await sql.unsafe(`
        alter table expenses
        alter column "createdAt" type timestamp with time zone
        using (
          case
            when "createdAt" ~ '^\\d{2}/\\d{2}/\\d{4}$' then to_timestamp("createdAt", 'DD/MM/YYYY')
            when "createdAt" ~ '^\\d{4}-\\d{2}-\\d{2}$' then ("createdAt"::date)::timestamp with time zone
            when nullif("createdAt", '') is null then now()
            else ("createdAt")::timestamp with time zone
          end
        )
      `);
      await sql.unsafe(`alter table expenses alter column "createdAt" set default now()`);
      await sql.unsafe(`update expenses set "createdAt" = now() where "createdAt" is null`);
      await sql.unsafe(`alter table expenses alter column "createdAt" set not null`);
      console.log('Converted expenses.createdAt to timestamptz.');
    }

    const alertAckType = await getColumnType('admin_alerts', 'acknowledgedAt');
    if (alertAckType === 'character varying' || alertAckType === 'text') {
      await sql.unsafe(`
        alter table admin_alerts
        alter column "acknowledgedAt" type timestamp with time zone
        using (
          case
            when nullif("acknowledgedAt", '') is null then null
            else ("acknowledgedAt")::timestamp with time zone
          end
        )
      `);
      console.log('Converted admin_alerts.acknowledgedAt to timestamptz.');
    }

    const auditCreatedAtType = await getColumnType('admin_audit_logs', 'createdAt');
    if (auditCreatedAtType === 'character varying' || auditCreatedAtType === 'text') {
      await sql.unsafe(`
        alter table admin_audit_logs
        alter column "createdAt" type timestamp with time zone
        using (
          case
            when nullif("createdAt", '') is null then now()
            else ("createdAt")::timestamp with time zone
          end
        )
      `);
      await sql.unsafe(`alter table admin_audit_logs alter column "createdAt" set default now()`);
      await sql.unsafe(`update admin_audit_logs set "createdAt" = now() where "createdAt" is null`);
      await sql.unsafe(`alter table admin_audit_logs alter column "createdAt" set not null`);
      console.log('Converted admin_audit_logs.createdAt to timestamptz.');
    }

    console.log('Column type migration completed.');
  } finally {
    await sql.end();
  }
};

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
