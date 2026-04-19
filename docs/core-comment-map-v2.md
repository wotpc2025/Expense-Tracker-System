# Expense Management System — Complete Code Comment Map

> **Purpose (EN):** Quick-reference knowledge base. Core runtime files and root operational config files are listed with their roles and key logic anchors.
>
> **วัตถุประสงค์ (TH):** แผนที่รวมคอมเมนต์ครบทุกไฟล์ในระบบ ใช้เป็นฐานข้อมูล แต่ละไฟล์ระบุหน้าที่ ฟังก์ชันสำคัญ และตำแหน่ง logic ที่ควรรู้

---

## 1. Database Layer / ชั้นฐานข้อมูล

### `utils/dbConfig.jsx`
**EN:** Creates the shared MySQL connection pool and exports the Drizzle ORM `db` instance.  
**TH:** สร้าง connection pool MySQL ที่ใช้ร่วมกันทั้งระบบ และ export `db` (Drizzle ORM)

| Export / Pattern | Description |
|---|---|
| `getMySqlPoolConfig()` | อ่าน `DATABASE_URL` (prod) หรือ `DB_*` env vars แยก (dev) |
| `const pool` | mysql2 connection pool — 10 connections, unlimited queue |
| `export const db` | Drizzle instance ใน `planetscale` mode (disable FK checks per session) |

---

### `utils/schema.jsx`
**EN:** Single source of truth for all 4 database table definitions.  
**TH:** แหล่งเดียวที่กำหนดโครงสร้างของทุก table ในฐานข้อมูล

| Table | Purpose (EN) | หน้าที่ (TH) |
|---|---|---|
| `Budgets` | Budget envelopes per user | งบประมาณแต่ละรายการของผู้ใช้ |
| `Expenses` | Spending transactions linked to a budget | รายจ่ายที่ผูกกับ budget ผ่าน `budgetId` |
| `AdminAlerts` | Alert acknowledgement status | สถานะการรับทราบ alert ของ admin |
| `AdminAuditLogs` | Immutable log of bulk admin operations | บันทึกถาวรการกระทำ bulk admin |

---

## 2. Server Actions / ฟังก์ชันฝั่ง Server

### `app/_actions/dbActions.js`
**EN:** Contains ALL database mutations and privileged reads. Invoked from Client Components via Next.js Server Actions — no manual API routes needed.  
**TH:** รวมทุก Server Action ที่เขียน/อ่าน DB พร้อม guard ความปลอดภัย เรียกจาก Client โดยไม่ต้องสร้าง API route เอง

**Section dividers in the file:**

| Section header | Functions included |
|---|---|
| `// ── Internal Helpers ──` | `toIsoDateTime`, `getInsertId`, `getAffectedRows`, `getCurrentActorEmail`, `createAdminAuditLogEntry` |
| `// ── Auth ──` | `getCurrentUserAdminStatusAction` |
| `// ── Budgets ──` | `checkUserBudgetsAction`, `createBudgetAction`, `getBudgetListAction`, `getBudgetInfoAction`, `updateBudgetAction`, `deleteBudgetAction`, `syncBudgetCategoryToExpensesAction` |
| `// ── Expenses ──` | `addNewExpenseAction`, `addBulkExpensesAction`, `getExpensesListAction`, `getAllExpensesAction`, `updateExpenseAction`, `deleteExpenseAction` |
| `// ── Admin — Monitoring ──` | `getAdminMonitoringDashboardAction`, `setAdminAlertStatusAction` |
| `// ── Admin — Users ──` | `getAdminUsersSummaryAction`, `getAdminUserDetailAction` |
| `// ── Admin — Database Management ──` | `getAdminDatabaseManagementAction` |
| `// ── Admin — Bulk Operations ──` | `adminBulkDeleteExpensesAction`, `adminBulkSetCategoryAction` |

**Security pattern (TH):** ทุก action ที่เขียน DB จะผ่าน `toMoneyNumber()` + `toDateValue()` ก่อน INSERT/UPDATE เสมอ; admin actions เรียก `isAdminUser()` ก่อนทำงาน

---

## 3. API Routes / เส้นทาง API

### `app/api/ai/scan-receipt/route.js`
**EN:** POST handler for AI receipt OCR. Calls OpenRouter vision model and returns structured expense data.  
**TH:** POST handler สำหรับสแกนใบเสร็จด้วย AI ส่งภาพไปหา OpenRouter แล้วคืนข้อมูลรายจ่ายที่ parse แล้ว

**Pipeline steps:**
1. Auth check (`currentUser()`)
2. Content-type guard (multipart/form-data)
3. Rate limit via `checkAndTrackReceiptScanRateLimit(ip)`
4. File validation (type + size)
5. Base64 encode image
6. OpenRouter API call (model: `OPENROUTER_MODEL`)
7. JSON extraction from markdown fences via `extractJson()`
8. Return `{ expenseName, amount, lineItems[] }`

---

### `app/api/health/db/route.js`
**EN:** GET `/api/health/db` — lightweight DB ping for SideNav status badge (polled every 30 s).  
**TH:** GET endpoint ตรวจสอบสถานะ DB แบบ lightweight คืน `{ status, latencyMs, checkedAt }` ให้ SideNav แสดง badge

---

## 4. Utility Libraries / ไลบรารีอรรถประโยชน์ (`lib/`)

### `lib/adminAccess.js`
**EN:** Pure functions for admin role + email allowlist checks, usable server-side and client-side.  
**TH:** ฟังก์ชัน pure สำหรับตรวจสอบสิทธิ์ admin ทั้ง role และ email allowlist ใช้ได้ทั้ง server และ client

| Function | What it does |
|---|---|
| `parseAdminEmails(raw)` | Split `ADMIN_EMAILS` env string by commas |
| `getUserRoleValue(user)` | Read `publicMetadata.role` (trusted) or `unsafeMetadata.role` (fallback) |
| `isAdminByRole(user)` | Check scalar and array role shapes |
| `isAdminByEmailAllowlist(user, raw)` | Compare primary email vs allowlist |
| `isAdminUser(user, raw)` | Master check: role OR allowlist → `boolean` |

---

### `lib/dataNormalization.js`
**EN:** Sanitize amounts and dates before any DB write — returns `null` on invalid input.  
**TH:** ทำความสะอาดข้อมูลตัวเลขและวันที่ก่อน INSERT/UPDATE ทุกครั้ง หากข้อมูลผิดรูปแบบจะคืน `null`

| Function | Input accepted | Returns |
|---|---|---|
| `toMoneyNumber(value, {allowZero})` | number, string with commas | `number \| null` — rejects NaN/Infinity/negative |
| `toDateValue(value)` | `dd/mm/yyyy`, `yyyy-mm-dd`, Date, ISO string | `Date \| null` |

---

### `lib/securityTelemetry.js`
**EN:** In-memory sliding-window rate limiter for the AI scan endpoint.  
**TH:** Rate limiter แบบ sliding window ในหน่วยความจำ สำหรับ endpoint สแกนใบเสร็จ

- Limit: **5 requests / 5 minutes** per IP
- Store: `globalThis.__securityTelemetryStore` (survives HMR in dev)
- `checkAndTrackReceiptScanRateLimit(ip)` → `{ allowed, retryAfterSeconds, remaining, limit, windowSeconds }`
- `getSecurityTelemetrySnapshot()` → live stats ให้ Admin panel แสดง

---

### `lib/csvExport.js`
**EN:** Client-side CSV generation and file download trigger.  
**TH:** สร้างไฟล์ CSV ฝั่ง client และ trigger การดาวน์โหลดอัตโนมัติ

| Function | Description |
|---|---|
| `exportRowsToCsv({ rows, columns, fileName })` | Build CSV with UTF-8 BOM and trigger download |
| `formatCurrencyForLanguage(value, locale)` | THB currency format per locale |
| `formatDateForLanguage(value, locale)` | DD/MM/YYYY (TH) or MM/DD/YYYY (EN) |
| `sanitizeFileNamePart(value)` | Strip unsafe characters from file name |

---

### `lib/expenseCategories.js`
**EN:** Category constants and deterministic color assignment for charts.  
**TH:** รายการหมวดหมู่รายจ่ายและระบบสีที่กำหนดไว้สำหรับกราฟ

- `DEFAULT_EXPENSE_CATEGORIES` — 13-item list shown in all dropdowns
- `EXPENSE_CATEGORY_COLORS` — named hex colors for known categories
- `getCategoryColor(category)` — returns named color or djb2-hash fallback from palette
- `normalizeCategoryName(category)` — trim-only normalizer

---

### `lib/translations.js`
**EN:** All UI text strings for English (`en`) and Thai (`th`) locales.  
**TH:** รวม text ทุก string ที่แสดงใน UI แยกตาม locale `en` และ `th`

- Structure: `translations[locale][section][key]`
- `getTranslation(lang, key)` — current resolver reads from `translations.en` (English-only runtime behavior at the moment)
- Usage: `getTranslation('th', 'dashboard.welcome')` ← never hard-code UI text in components

---

### `lib/budgetEmojiSuggest.js`
**EN:** Real-time emoji suggestion as user types budget name — bilingual keyword matching.  
**TH:** แนะนำ emoji แบบ real-time ตามชื่อ budget ที่ผู้ใช้พิมพ์ รองรับทั้งภาษาไทยและอังกฤษ

- `RULES` — array of `{ emoji, keywords[] }` covering 20+ categories
- `suggestEmoji(budgetName)` — returns first matched emoji or `undefined`
- Called in `CreateBudget.jsx` via `useEffect` watching the name input field

---

### `lib/useDashboardDateFilter.js`
**EN:** Shared date filter state hook used by Dashboard, BudgetList, and Expenses pages.  
**TH:** hook ที่แชร์สถานะ date filter ระหว่าง Dashboard, BudgetList และ Expenses

- Modes: `'month'` | `'range'` | `'all'`
- Persisted to `localStorage` key `dashboard-date-filter-v1`
- Cross-tab sync via `storage` event; same-tab sync via custom `dashboard-date-filter-sync` event

---

### `lib/useDashboardDensity.js`
**EN:** UI density preference hook — comfortable / compact / auto.  
**TH:** hook สำหรับเลือกความหนาแน่นของ UI โดย `auto` จะ responsive ตาม breakpoint 1280 px

Returns: `[density, setDensity, resolvedDensity, resetDensity]`

---

### `lib/utils.js`
**EN:** Tailwind class merge utility. `cn(...inputs)` = `clsx` + `tailwind-merge`.  
**TH:** ฟังก์ชัน `cn()` รวม class Tailwind โดยไม่ conflict

---

## 5. App Root / โครงสร้างรากแอป

### `app/layout.js`
**EN:** Next.js root layout — wraps every page with `ClerkProvider`, `ThemeProvider`, and `Toaster`.  
**TH:** Layout รากของ Next.js ครอบทุกหน้าด้วย Clerk Auth, Theme, และ Toast notifications

- `suppressHydrationWarning` on `<html>` required by next-themes
- Fonts: Geist Sans, Geist Mono, Outfit

### `app/page.js`
**EN:** Public landing page (`/`). Signed-in users are redirected to `/dashboard`.  
**TH:** หน้า Landing สาธารณะ หากผู้ใช้ login แล้วจะ redirect ไป `/dashboard`

### `app/_components/Header.jsx`
**EN:** Landing page top nav — logo + greeting (signed-in) or "Get Started" CTA (signed-out).  
**TH:** แถบนำทางบนหน้า Landing แสดง logo และปุ่ม CTA

### `app/_components/Hero.jsx`
**EN:** Marketing hero section — headline, subtitle, CTA button, dashboard preview image.  
**TH:** ส่วน Hero ของหน้าหลัก — presentational ล้วนๆ ไม่มี state

---

## 6. Dashboard Pages / หน้าแดชบอร์ด

### `app/(routes)/dashboard/layout.jsx`
**EN:** Dashboard shell — mounts SideNav + DashboardHeader around all `/dashboard/**` routes. Client-side auth guard redirects budget-less users to `/dashboard/budgets`.  
**TH:** Layout ของ Dashboard ซึ่งครอบ SideNav + Header รอบทุกหน้าย่อย มี guard redirect ผู้ใช้ที่ยังไม่มี budget

### `app/(routes)/dashboard/page.jsx`
**EN:** Main dashboard. Aggregates stat cards, bar chart, budget grid, and recent expenses. Redirects admin users to `/dashboard/admin`.  
**TH:** หน้าหลักของ Dashboard รวมสถิติ กราฟ งบประมาณ และรายจ่ายล่าสุด; admin จะถูก redirect ไปหน้า admin

### `app/(routes)/dashboard/budgets/page.jsx`
**EN:** Thin shell page for the budget section — renders `<BudgetList>`.  
**TH:** หน้า wrapper บางๆ สำหรับส่วน Budgets ส่งต่อการแสดงผลให้ `BudgetList`

### `app/(routes)/dashboard/expenses/page.jsx`
**EN:** All-expenses view (cross-budget) with date filter, stat cards, and `ExpensesListTable`.  
**TH:** หน้ารายจ่ายทั้งหมด (ข้ามทุก budget) พร้อม date filter และตาราง

### `app/(routes)/dashboard/expenses/[id]/page.jsx`
**EN:** Budget detail page — BudgetItem card, stat cards, AddExpense form, ExpensesListTable.  
**TH:** หน้าแสดงรายละเอียดของ budget เดียว พร้อมฟอร์มเพิ่มรายจ่ายและตารางรายจ่ายในงบนั้น

### `app/(routes)/dashboard/reports/page.jsx`
**EN:** Full analytics page — line chart, pie chart, bar chart, budget performance table, CSV/PDF export.  
**TH:** หน้ารายงานเต็มรูปแบบ กราฟหลายชนิด ตาราง export CSV/PDF

---

## 7. Admin Pages / หน้า Admin

### `app/(routes)/dashboard/admin/layout.jsx`
**EN:** Server-side admin guard for ALL `/dashboard/admin/**` routes — redirects non-admins.  
**TH:** Server Component guard ป้องกันทุก route ภายใต้ admin หากไม่ใช่ admin จะ redirect ทันที

### `app/(routes)/dashboard/admin/page.jsx`
**EN:** Admin monitoring dashboard — overview cards, data quality alerts, alert acknowledgement, security telemetry, audit log.  
**TH:** หน้า monitoring ของ admin รวมสถิติระบบ, alert, telemetry rate limit, และ audit log

### `app/(routes)/dashboard/admin/users/page.jsx`
**EN:** Per-user summary table — click a row to expand per-budget breakdown.  
**TH:** ตารางสรุปผู้ใช้ทุกคน คลิกแถวเพื่อดูรายละเอียด budget

### `app/(routes)/dashboard/admin/database/page.jsx`
**EN:** Read-only DB workbench — raw rows from all 4 tables, searchable, sortable, paginated.  
**TH:** หน้าดู raw data จากทุก table อ่านอย่างเดียว ค้นหาและเรียงลำดับได้

---

## 8. Dashboard Components / คอมโพเนนต์แดชบอร์ด

### `app/(routes)/dashboard/_components/SideNav.jsx`
**EN:** Left sidebar — role-aware nav menu, DB status badge (polls `/api/health/db` every 30 s), user info, ThemeToggle.  
**TH:** Sidebar ซ้าย แสดงเมนูตาม role, badge สถานะ DB (refresh ทุก 30 วินาที), ข้อมูลผู้ใช้, สลับ theme

### `app/(routes)/dashboard/_components/DashboardHeader.jsx`
**EN:** Top bar — SidebarTrigger, greeting, UserButton for Clerk profile/sign-out.  
**TH:** แถบบนสุดของ dashboard SidebarTrigger, ข้อความทักทาย, UserButton ของ Clerk

### `app/(routes)/dashboard/_components/CardInfo.jsx`
**EN:** 3 KPI summary cards — Total Budget, Total Spend, Active Budgets. Shows skeleton while loading.  
**TH:** การ์ดสรุป KPI 3 ใบ แสดง skeleton ระหว่างโหลด

### `app/(routes)/dashboard/_components/BarChartDashboard.jsx`
**EN:** Recharts grouped bar chart comparing budget limit vs actual spend per budget.  
**TH:** กราฟแท่งคู่ (Recharts) เปรียบเทียบวงเงินกับยอดจ่ายจริงแต่ละ budget

### `app/(routes)/dashboard/_components/EditBudget.jsx`
**EN:** Edit budget dialog — emoji picker, name/amount/category, sync-to-expenses bulk action.  
**TH:** Dialog แก้ไข budget มี emoji picker, ช่อง category, และปุ่ม Sync Category ให้รายจ่ายทั้งหมดในงบ

### `app/(routes)/dashboard/_components/StatCard.jsx`
**EN:** Reusable metric card with optional sparkline trend chart and tooltip.  
**TH:** การ์ดตัวเลข reusable มี sparkline chart และ tooltip สรุปสูตรคำนวณ

---

## 9. Budget Components / คอมโพเนนต์ Budget

### `app/(routes)/dashboard/budgets/_components/BudgetItem.jsx`
**EN:** Single budget card — emoji, name, spend progress bar, remaining label.  
**TH:** การ์ด budget หนึ่งรายการ แสดง progress bar ที่ใช้ไปและที่เหลือ คลิกเพื่อดูรายละเอียด

### `app/(routes)/dashboard/budgets/_components/BudgetList.jsx`
**EN:** Budget grid with date filter, view/density toggles, stat cards, and CreateBudget card.  
**TH:** ตารางกริด budget ทั้งหมด พร้อม date filter, toggle มุมมอง/ความหนาแน่น, KPI cards, และปุ่มสร้าง budget

### `app/(routes)/dashboard/budgets/_components/CreateBudget.jsx`
**EN:** 2-step dialog — Step 1: Create budget (emoji, name, amount, AI scan); Step 2: Add first expense.  
**TH:** Dialog 2 ขั้นตอน ขั้นที่ 1 สร้าง budget (มีสแกน AI), ขั้นที่ 2 เพิ่มรายจ่ายแรก

### `app/(routes)/dashboard/budgets/_components/ExpensesListTable.jsx`
**EN:** ag-Grid expense table — search, category filter, inline edit/delete, CSV export (TH/EN), dark mode.  
**TH:** ตาราง ag-Grid สำหรับรายจ่าย ค้นหา กรอง แก้ไข/ลบ inline, export CSV ทั้ง TH/EN, รองรับ dark mode

---

## 10. Expense Components / คอมโพเนนต์รายจ่าย

### `app/(routes)/dashboard/expenses/_components/AddExpense.jsx`
**EN:** Dual-mode expense form — manual entry OR AI receipt scan (line item checklist).  
**TH:** ฟอร์มเพิ่มรายจ่าย 2 โหมด คือกรอกเอง หรือสแกนใบเสร็จด้วย AI แล้วเลือกรายการที่ต้องการ

- Mode A (Manual): name, amount, category, date → `addNewExpenseAction()`
- Mode B (AI Scan): upload image → line item checklist → `addBulkExpensesAction()`

---

## Key Architecture Patterns / รูปแบบสถาปัตยกรรมสำคัญ

| Pattern | Where / ที่ |
|---|---|
| Server Actions replace REST APIs | `app/_actions/dbActions.js` (ไม่ต้องสร้าง API route สำหรับ mutation) |
| Input sanitization before every DB write | `toMoneyNumber()` + `toDateValue()` ใน `lib/dataNormalization.js` |
| Admin guard on every privileged operation | `isAdminUser()` ใน `lib/adminAccess.js` ถูกเรียกก่อน admin actions ทุกตัว |
| Shared date filter state across pages | `lib/useDashboardDateFilter.js` ใช้ใน Dashboard, BudgetList, Expenses |
| In-process rate limiting (no Redis needed) | `globalThis.__securityTelemetryStore` ใน `lib/securityTelemetry.js` |
| Clerk `publicMetadata.role = 'admin'` | `adminAccess.js → isAdminByRole()` |
| Drizzle ORM `planetscale` mode | `utils/dbConfig.jsx` (ปิด FK checks per session, ใช้ได้กับ PlanetScale + MySQL) |
| `cn()` for all Tailwind class merging | `lib/utils.js` — import ในทุก component ที่มี conditional classes |

---

## 11. Directory + Line of Code Index (Quick Find)

> EN: Use this section when you need exact jump points in source files.  
> TH: ใช้ตารางนี้เพื่อกระโดดไปยังบรรทัดสำคัญในไฟล์ได้เร็ว

| File | Directory | Key LOC |
|---|---|---|
| `app/_actions/dbActions.js` | `app/_actions` | L71 `toIsoDateTime`, L79 `getInsertId`, L977 `adminBulkDeleteExpensesAction` |
| `app/api/ai/scan-receipt/route.js` | `app/api/ai/scan-receipt` | L27 `OPENROUTER_MODEL`, L29 `mapScanErrorToThai`, L88 `POST` |
| `app/api/health/db/route.js` | `app/api/health/db` | L20 `dynamic`, L22 `GET` |
| `lib/adminAccess.js` | `lib` | L19 `parseAdminEmails`, L33 `getUserRoleValue`, L41 `isAdminUser` |
| `lib/dataNormalization.js` | `lib` | L24 `toMoneyNumber`, L52 `toDateValue` |
| `lib/securityTelemetry.js` | `lib` | L20 `RATE_WINDOW_MS`, L31 `checkAndTrackReceiptScanRateLimit`, L64 `getSecurityTelemetrySnapshot` |
| `lib/csvExport.js` | `lib` | L19 `EXPORT_LANGUAGE_OPTIONS`, L30 `sanitizeFileNamePart`, L39 `formatCurrencyForLanguage` |
| `lib/expenseCategories.js` | `lib` | L15 `DEFAULT_EXPENSE_CATEGORIES`, L31 `EXPENSE_CATEGORY_COLORS`, L62 `getColorFromCategoryName` |
| `lib/translations.js` | `lib` | L24 `translations`, L1082 `getTranslation` |
| `lib/budgetEmojiSuggest.js` | `lib` | L22 `RULES`, L144 `suggestEmoji` |
| `lib/useDashboardDateFilter.js` | `lib` | L23 `STORAGE_KEY`, L27 `readStoredFilter` |
| `lib/useDashboardDensity.js` | `lib` | L20 `useDashboardDensity` |
| `lib/utils.js` | `lib` | L13 `cn` |
| `utils/dbConfig.jsx` | `utils` | L25 `getMySqlPoolConfig`, L58 `pool`, L61 `db` |
| `utils/schema.jsx` | `utils` | L20 `Budgets`, L30 `Expenses`, L40 `AdminAlerts`, L49 `AdminAuditLogs` |
| `app/layout.js` | `app` | L34 `metadata`, L39 `RootLayout` |
| `app/page.js` | `app` | L18 `Home` |
| `app/_components/Header.jsx` | `app/_components` | L23 `Header` |
| `app/_components/Hero.jsx` | `app/_components` | L19 `Hero` |
| `app/(routes)/dashboard/layout.jsx` | `app/(routes)/dashboard` | L32 `DashboardLayout`, L55 `getUserBudgets` |
| `app/(routes)/dashboard/page.jsx` | `app/(routes)/dashboard` | L41 `Dashboard`, L67 `parseDate` |
| `app/(routes)/dashboard/budgets/page.jsx` | `app/(routes)/dashboard/budgets` | L15 `page` |
| `app/(routes)/dashboard/expenses/page.jsx` | `app/(routes)/dashboard/expenses` | L28 `ExpensesPage`, L49 `parseDate` |
| `app/(routes)/dashboard/expenses/[id]/page.jsx` | `app/(routes)/dashboard/expenses/[id]` | L53 `ExpensesScreen` |
| `app/(routes)/dashboard/reports/page.jsx` | `app/(routes)/dashboard/reports` | L49 `PIE_COLORS`, L72 `ReportsPage` |
| `app/(routes)/dashboard/admin/layout.jsx` | `app/(routes)/dashboard/admin` | L19 `AdminLayout` |
| `app/(routes)/dashboard/admin/page.jsx` | `app/(routes)/dashboard/admin` | L55 `AdminDashboardPage` |
| `app/(routes)/dashboard/admin/users/page.jsx` | `app/(routes)/dashboard/admin/users` | L34 `AdminUsersPage` |
| `app/(routes)/dashboard/admin/database/page.jsx` | `app/(routes)/dashboard/admin/database` | L50 `views`, L77 `AdminDatabasePage` |
| `app/(routes)/dashboard/_components/SideNav.jsx` | `app/(routes)/dashboard/_components` | L44 `SideNav`, L78 `checkDatabaseStatus` |
| `app/(routes)/dashboard/_components/DashboardHeader.jsx` | `app/(routes)/dashboard/_components` | L20 `DashboardHeader` |
| `app/(routes)/dashboard/_components/CardInfo.jsx` | `app/(routes)/dashboard/_components` | L25 `CardInfo`, L35 `CalculateCardInfo` |
| `app/(routes)/dashboard/_components/BarChartDashboard.jsx` | `app/(routes)/dashboard/_components` | L29 `getChartConfig`, L42 `BarChartDashboard` |
| `app/(routes)/dashboard/_components/EditBudget.jsx` | `app/(routes)/dashboard/_components` | L57 `EditBudget`, L67 `uniqueCategories` |
| `app/(routes)/dashboard/_components/StatCard.jsx` | `app/(routes)/dashboard/_components` | L34 `Sparkline`, L68 `StatCard` |
| `app/(routes)/dashboard/budgets/_components/BudgetItem.jsx` | `app/(routes)/dashboard/budgets/_components` | L22 `BudgetItem`, L25 `calculateProgressPercentage` |
| `app/(routes)/dashboard/budgets/_components/BudgetList.jsx` | `app/(routes)/dashboard/budgets/_components` | L38 `BudgetList`, L61 `parseDate` |
| `app/(routes)/dashboard/budgets/_components/CreateBudget.jsx` | `app/(routes)/dashboard/budgets/_components` | L49 `CreateBudget`, L50 `getScannedTotal` |
| `app/(routes)/dashboard/budgets/_components/ExpensesListTable.jsx` | `app/(routes)/dashboard/budgets/_components` | L72 `ExpensesListTable`, L59 `EXPORT_LANGUAGE_OPTIONS` |
| `app/(routes)/dashboard/expenses/_components/AddExpense.jsx` | `app/(routes)/dashboard/expenses/_components` | L42 `AddExpense`, L57 `receiptInputRef` |

### Quick CLI Search Tips

- Find by function name: `rg -n "getAdminMonitoringDashboardAction" app/_actions/dbActions.js`
- Find by file + line (VS Code): `Go to Line` -> type the number, e.g. `1082` in `lib/translations.js`
- Find by directory first: `rg --files app/(routes)/dashboard/_components`

---

## 12. Root Config & DevOps Files / ไฟล์ตั้งค่าระดับโปรเจกต์

### `.dockerignore`
**EN:** Controls which files are excluded from Docker build context to speed up builds and avoid copying secrets/artifacts.  
**TH:** กำหนดไฟล์ที่ไม่ส่งเข้า Docker build context เพื่อลดขนาดและป้องกันการพาไฟล์สำคัญเข้า image

### `.gitignore`
**EN:** Defines local/dev artifacts, generated outputs, and secrets that should not be committed to Git.  
**TH:** ระบุไฟล์ชั่วคราว/ไฟล์ build/ความลับที่ไม่ควรถูก commit

### `Dockerfile`
**EN:** Multi-stage container build for Next.js standalone runtime (`base -> deps -> builder -> runner`).  
**TH:** Dockerfile แบบหลาย stage สำหรับ build และรัน Next.js โหมด standalone อย่างเบาและปลอดภัย

### `docker-compose.yml`
**EN:** Service orchestration for production-like run: build args, env injection, restart policy, and port mapping.  
**TH:** ไฟล์ประกอบการรัน service ด้วย Docker Compose ครอบคลุม build args, env, restart และพอร์ต

### `deploy.sh`
**EN:** End-to-end deployment automation with Discord notifications and fail-safe trap handling.  
**TH:** สคริปต์ deploy อัตโนมัติครบ flow พร้อมแจ้งเตือน Discord และดักข้อผิดพลาด

### `next.config.mjs`
**EN:** Next.js runtime config for standalone output and global security headers.  
**TH:** ตั้งค่า Next.js สำหรับ standalone build และ security headers ทั้งระบบ

### `proxy.ts`
**EN:** Clerk middleware access control for public/private route matching and API protection.  
**TH:** middleware ของ Clerk สำหรับป้องกัน route ส่วน private และบังคับ auth บน API

### `drizzle.config.js`
**EN:** Drizzle Kit CLI configuration (schema path, dialect, migration output, DB credentials resolution).  
**TH:** ตั้งค่า Drizzle CLI สำหรับ schema, dialect, โฟลเดอร์ migration และการ resolve ค่าฐานข้อมูล

### `postcss.config.mjs`
**EN:** PostCSS pipeline config used by Tailwind/Next build.  
**TH:** ตั้งค่า PostCSS ที่ใช้ใน pipeline ของ Tailwind/Next.js

### `components.json`
**EN:** shadcn/ui generator settings for style presets and import aliases.  
**TH:** ตั้งค่า generator ของ shadcn/ui สำหรับ style และ alias

### `jsconfig.json`
**EN:** JavaScript path alias configuration (`@/*`) used across imports.  
**TH:** ตั้งค่า path alias (`@/*`) สำหรับ import ในโปรเจกต์

### Root Files — Directory + LOC Index

| File | Directory | Key LOC |
|---|---|---|
| `.dockerignore` | project root | L1 ignore policy header |
| `.gitignore` | project root | L1 ignore policy header |
| `Dockerfile` | project root | L11 `base`, L21 `npm ci`, L43 `npm run build`, L65 `CMD` |
| `components.json` | project root | L1 JSON config root |
| `deploy.sh` | project root | L19 `set -e`, L26 `send_discord_msg`, L43 `trap`, L51-L65 deploy steps |
| `docker-compose.yml` | project root | L7 `services`, L8 `expense-tracker-app` |
| `drizzle.config.js` | project root | L1 `defineConfig` import, L42 `defineConfig(...)` |
| `jsconfig.json` | project root | L1 JSON config root |
| `next.config.mjs` | project root | L2 `nextConfig`, L39 export |
| `postcss.config.mjs` | project root | L3 `plugins`, L8 export |
| `proxy.ts` | project root | L1 Clerk import, L7 public routes, L14 middleware, L23 matcher |
