export const translations = {
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      budgets: 'Budgets',
      expenses: 'Expenses',
      reports: 'Reports',
      admin: 'Admin',
      adminMonitoring: 'Admin Monitoring',
      adminUsers: 'Admin Users',
      adminDatabase: 'Database Management',
    },

    // Common
    profile: 'Profile',
    logout: 'Logout',
    language: 'Language',
    theme: 'Theme',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    search: 'Search',
    export: 'Export',
    done: 'Done',
    next: 'Next →',
    loading: 'Loading...',
    noData: 'No data',
    item: 'Item',
    items: 'Items',
    placeholder: {
      budgetName: 'e.g. Home Decor',
      expenseName: 'e.g. Home Decor',
      budgetAmount: 'e.g. 5000฿',
      expenseAmount: 'e.g. 1000฿',
      category: 'e.g. Food',
    },

    // Dashboard Page
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      totalBudget: 'Total Budget',
      totalSpend: 'Total Spend',
      activeBudgets: 'Active Budgets',
      budgetVsSpend: 'Budget vs Spend',
      monthlyOverview: 'Monthly activity overview',
      noBudgetData: 'No budget data to display yet.',
      latestBudgets: 'Latest Budgets',
    },

    // Budgets Page Main
    budgetsPage: {
      title: 'Budget Center',
      heading: 'My Budgets',
      subtitle: 'Track budget limits and monitor spending in one place.',
    },

    // Budgets Page Stats
    budgetStats: {
      totalBudget: 'Total Budget',
      budgetCapacity: 'Budget capacity',
      totalBudgetFormula: 'SUM(all budget amount)',
      totalSpend: 'Total Spend',
      moneyUsed: 'Money used',
      totalSpendFormula: 'SUM(all totalSpend)',
      remaining: 'Remaining',
      availableNow: 'Available now',
      remainingFormula: 'Total Budget - Total Spend',
      activeBudgets: 'Active Budgets',
      currentPlans: 'Current plans',
      activeBudgetsFormula: 'COUNT(budget records)',
    },

    // Budgets Page - Density
    density: {
      compact: 'Compact',
      comfort: 'Comfort',
      auto: 'Auto',
    },

    // Create Budget Dialog
    createBudget: {
      title: 'Create New Budget',
      step1Title: 'Create Budget',
      step2Title: 'Add Expenses',
      selectEmoji: 'Select Emoji',
      budgetName: 'Budget Name',
      scanReceipt: 'Scan Receipt',
      createButton: 'Create Budget',
      createAndReviewButton: 'Create Budget & Review Expenses',
      toasts: {
        scanSuccess: 'Scan successful - found {count} items — Enter budget name and click Create Budget',
        scanSuccessNoBudget: 'Receipt scanned successfully — Enter budget name and click Create Budget',
        scanFailed: 'Receipt scan failed. Please try again.',
        createSuccess: 'New Budget Created!',
        createFailed: 'Failed to create budget. Please try again.',
      },
    },

    // Budget Item
    budgetItem: {
      items: 'items',
      spent: 'Spent',
      remaining: 'Remaining',
      percentUsed: '% Used',
    },

    // Edit Budget Dialog
    editBudget: {
      title: 'Update Budget',
      budgetName: 'Budget Name',
      budgetAmount: 'Budget Amount',
      defaultCategory: 'Default Category (optional)',
      syncCategory: 'Sync Category To Existing Expenses',
      syncTitle: 'Sync existing expenses?',
      syncDescription: 'This will update all existing expenses in this budget to category "{category}".',
      updateButton: 'Update Budget',
      confirmSync: 'Confirm Sync',
    },

    // Expenses Page
    expensesPage: {
      title: 'Expense Journal',
      heading: 'My Expenses',
      subtitle: 'Search, filter, and export all expenses quickly.',
    },

    // Expenses Stats
    expensesStats: {
      thisMonth: 'This Month',
      thisMonthFormula: 'SUM(expenses in current month)',
      totalAmount: 'Total Amount',
      allRecords: 'Total records',
      totalAmountFormula: 'SUM(all expense amounts)',
      avgPerDay: 'Daily Average',
      avgPerDayFormula: 'This Month Total / Days Elapsed',
      topCategory: 'Top Category',
      topCategoryFormula: 'Highest spending category',
    },

    // Expenses [id] Page
    expensesDetailPage: {
      label: 'Expense Detail',
      heading: 'My Expenses',
      subtitle: 'Manage budget detail, add expenses, and keep entries clean.',
    },

    // Add Expense
    addExpense: {
      addExpense: 'Add Expense',
      expenseName: 'Expense Name',
      expenseAmount: 'Expense Amount',
      category: 'Category (optional)',
      selectCategory: 'Select category',
      newCategory: 'Add new category',
      addNewCategory: 'Add Category',
      addButton: 'Add New Expense',
      scanReceipt: 'Scan Receipt with AI',
      scanning: 'Scanning Receipt...',
      scannedItems: 'Scanned Items',
      selectedCount: 'Selected: {count}',
      selectAll: 'Select All',
      unselectAll: 'Unselect All',
      addSelected: 'Add Selected',
      toasts: {
        scanFailed: 'Receipt scan failed.',
        scanSuccess: 'Receipt scanned successfully.',
        scanRetry: 'Receipt scan failed. Please try again.',
        noScannedItems: 'No scanned items available.',
        selectAtLeastOne: 'Please select at least 1 item.',
        addMultipleFailed: 'Failed to add items from receipt.',
        addSuccess: 'Expense added successfully.',
        addFailed: 'Failed to add expense.',
      },
    },

    // Expenses Table
    expensesTable: {
      name: 'Name',
      category: 'Category',
      amount: 'Amount',
      date: 'Date',
      actions: 'Actions',
      noResults: 'No expenses found.',
      deleteConfirm: 'Delete this expense?',
      deleteSuccess: 'Expense Deleted!',
      deleteFailed: 'Failed to delete expense.',
    },

    // Budgets Page
    budgets: {
      title: 'Budgets',
      createNew: 'Create New Budget',
      noBudgets: 'No budgets yet. Create one to get started.',
      budgetName: 'Budget Name',
      amount: 'Amount',
      category: 'Category',
      selectIcon: 'Select Icon',
      selectEmoji: 'Select Emoji',
      scanReceipt: 'Scan Receipt',
      createBudget: 'Create Budget',
      createBudgetReview: 'Create Budget & Review Expenses',
      addExpenses: 'Add Expenses',
      reviewScanned: 'Review Scanned Items',
      scanSuccess: 'Receipt scanned successfully!',
      aiAutoSuggest: 'AI',
      step: 'Step',
      of: 'of',
    },

    // Expense Details
    expenses: {
      title: 'Expenses',
      addNew: 'Add New Expense',
      expenseName: 'Expense Name',
      amount: 'Amount',
      category: 'Category',
      date: 'Date',
      description: 'Description',
      noExpenses: 'No expenses yet.',
      deleteConfirm: 'Are you sure you want to delete this expense?',
      expenseDetails: 'Expense Details',
      editExpense: 'Edit Expense',
      scannedItems: 'Scanned Items',
      selectScanned: 'Select items to add',
    },

    // Reports Page
    reports: {
      title: 'Reports & Analytics',
      subtitle: 'Overview of your spending and budgets',
      lastUpdated: 'Last updated',
      thisMonth: 'Spending This Month',
      fromLastMonth: 'from last month',
      totalAllTime: 'Total All Time',
      allTransactions: 'all transactions',
      avgPerDay: 'Average Per Day',
      daysInMonth: 'days in this month',
      topCategory: 'Top Category',
      monthlyTrend: 'Spending Trend (6 months)',
      trendDesc: 'Total monthly spending history',
      byCategoryPie: 'Spending by Category',
      byCategoryDesc: 'Top 8 categories (all time)',
      budgetVsActual: 'Budget vs Actual Spending',
      budgetVsActualDesc: 'Comparison of planned vs actual spending for each budget',
      budgetPerformance: 'Budget Summary',
      budget: 'Budget',
      budgetAmount: 'Budget Amount',
      actualSpent: 'Actual Spent',
      remaining: 'Remaining',
      ratio: 'Ratio',
      noExpenseData: 'No expense data yet.',
      noBudgetData: 'No budget data.',
    },

    // Admin Page
    admin: {
      title: 'Admin Monitoring Dashboard',
      subtitle: 'Monitor data quality and app activity in one place',
      filters: {
        allTime: 'All time',
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        thisMonth: 'This month',
        customRange: 'Custom range',
        allUsers: 'All users',
        allCategories: 'All categories',
      },
      cards: {
        totalUsers: 'Total Users',
        totalBudgets: 'Total Budgets',
        totalExpenses: 'Total Expenses',
        totalSpend: 'Total Spend',
        avgExpense: 'Average Expense',
      },
      alerts: {
        title: 'Alerts Center',
        noAlerts: 'No active alerts',
        ack: 'Acknowledge',
        unack: 'Unacknowledge',
      },
      audit: {
        title: 'Audit Log',
        empty: 'No audit events in selected range',
      },
      workbench: {
        title: 'Data Quality Workbench',
        run: 'Run',
        fixMissingCategory: 'Set missing category to Uncategorized',
        deleteInvalidAmount: 'Delete invalid amount records',
        removeDuplicates: 'Delete possible duplicate records',
        confirmTitle: 'Confirm delete',
        confirmInvalid: 'This will permanently delete all invalid amount records in the current filter.',
        confirmDuplicate: 'This will permanently delete all possible duplicate records in the current filter.',
      },
      monitoring: {
        title: 'Data Quality Monitoring',
        missingCategory: 'Missing Category',
        invalidAmount: 'Invalid Amount',
        duplicates: 'Possible Duplicates',
        budgetsOverLimit: 'Budgets Over Limit',
        txThisMonth: 'Transactions This Month',
        alert: 'Detected unusual records. Review and fix incorrect entries to keep reporting accurate.',
      },
      recent: {
        title: 'Recent Expense Activity',
        name: 'Name',
        category: 'Category',
        amount: 'Amount',
        date: 'Date',
        empty: 'No activity found',
      },
    },

    adminUsers: {
      title: 'Admin Users Overview',
      subtitle: 'Summary of user-level budget and spending activity',
      detail: {
        title: 'User Drilldown',
        selectUser: 'Select a user from the table to inspect details',
        recentExpenses: 'Recent Expenses',
      },
      columns: {
        email: 'Email',
        budgets: 'Budgets',
        expenses: 'Expenses',
        totalBudget: 'Total Budget',
        totalSpend: 'Total Spend',
      },
      empty: 'No user activity found',
    },

    adminDatabase: {
      title: 'Database Management',
      subtitle: 'Read-only snapshot of database records for admin inspection',
      readOnlyNote: 'This page is read-only by design. Use admin actions and workbench tools for controlled edits instead of direct database mutation.',
      searchPlaceholder: 'Search current table...',
      empty: 'No rows found',
      detail: {
        title: 'Record Detail',
        subtitle: 'Inspect all fields from the selected record in',
        field: 'Field',
        value: 'Value',
        copyJson: 'Copy JSON',
        copySuccess: 'Record JSON copied',
        copyError: 'Failed to copy JSON',
      },
      pagination: {
        showing: 'Showing',
        of: 'of',
        filteredFrom: 'from total rows',
        rowsPerPage: 'Rows per page',
        previous: 'Previous',
        next: 'Next',
        page: 'Page',
      },
      views: {
        budgets: 'Budgets',
        expenses: 'Expenses',
        alerts: 'Alerts',
        audit: 'Audit Logs',
      },
      cards: {
        users: 'Users',
        budgets: 'Budgets',
        expenses: 'Expenses',
        activeAlerts: 'Active Alerts',
        auditEvents: 'Audit Events',
      },
      columns: {
        name: 'Name',
        category: 'Category',
        owner: 'Owner',
        amount: 'Amount',
        spend: 'Spend',
        items: 'Items',
        budget: 'Budget',
        date: 'Date',
        key: 'Key',
        status: 'Status',
        actor: 'Actor',
        action: 'Action',
        message: 'Message',
      },
    },

    // Stat Card
    statCard: {
      thisMonth: 'This Month',
    },

    // Card Info
    cardInfo: {
      totalBudget: 'Total Budget',
      totalSpending: 'Total Spending',
      activeBudgets: 'Active Budgets',
    },

    // Edit Budget
    editBudgetTitle: 'Edit Budget',
    updateSuccess: 'Budget updated successfully',
    updateError: 'Failed to update budget',

    // Categories (expenses)
    categories: {
      food: 'Food & Dining',
      transport: 'Transportation',
      shopping: 'Shopping',
      entertainment: 'Entertainment',
      utilities: 'Utilities',
      health: 'Health & Medical',
      education: 'Education',
      housing: 'Housing',
      beauty: 'Beauty & Personal Care',
      fitness: 'Fitness',
      travel: 'Travel',
      technology: 'Technology',
      finance: 'Finance & Insurance',
      pets: 'Pets',
      baby: 'Baby & Kids',
      gifts: 'Gifts & Donations',
      work: 'Work & Professional',
      uncategorized: 'Uncategorized',
    },

    // Dialogs & Modals
    dialogs: {
      confirmDelete: 'Confirm Delete',
      deleteMessage: 'Are you sure you want to delete this?',
      deleteConfirm: 'Yes, Delete',
      cancel: 'Cancel',
    },

    // Messages
    messages: {
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      tryAgain: 'Try Again',
    },

    // Auth Pages (if any)
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
    },
  },

  th: {
    // Navigation
    nav: {
      dashboard: 'แดชบอร์ด',
      budgets: 'งบประมาณ',
      expenses: 'ค่าใช้จ่าย',
      reports: 'รายงาน',
      admin: 'ผู้ดูแล',
      adminMonitoring: 'มอนิเตอร์ผู้ดูแล',
      adminUsers: 'ผู้ใช้ระบบ',
      adminDatabase: 'จัดการฐานข้อมูล',
    },

    // Common
    profile: 'โปรไฟล์',
    logout: 'ออกจากระบบ',
    language: 'ภาษา',
    theme: 'ธีม',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    create: 'สร้าง',
    edit: 'แก้ไข',
    delete: 'ลบ',
    close: 'ปิด',
    search: 'ค้นหา',
    export: 'ส่งออก',
    done: 'เสร็จสิ้น',
    next: 'ถัดไป →',
    loading: 'กำลังโหลด...',
    noData: 'ไม่มีข้อมูล',
    item: 'รายการ',
    items: 'รายการ',
    placeholder: {
      budgetName: 'เช่น การตกแต่งบ้าน',
      expenseName: 'เช่น การตกแต่งบ้าน',
      budgetAmount: 'เช่น 5000฿',
      expenseAmount: 'เช่น 1000฿',
      category: 'เช่น อาหาร',
    },

    // Dashboard Page
    dashboard: {
      title: 'แดชบอร์ด',
      welcome: 'ยินดีต้อนรับกลับมา',
      totalBudget: 'งบประมาณทั้งหมด',
      totalSpend: 'ใช้จ่ายทั้งหมด',
      activeBudgets: 'งบประมาณที่ใช้งาน',
      budgetVsSpend: 'งบประมาณ vs ใช้จ่าย',
      monthlyOverview: 'ภาพรวมกิจกรรมรายเดือน',
      noBudgetData: 'ยังไม่มีข้อมูลงบประมาณ',
      latestBudgets: 'งบประมาณล่าสุด',
    },

    // Budgets Page Main
    budgetsPage: {
      title: 'ศูนย์กลางงบประมาณ',
      heading: 'งบประมาณของฉัน',
      subtitle: 'ติดตามขีดจำกัดงบประมาณและตรวจสอบค่าใช้จ่ายในที่เดียว',
    },

    // Budgets Page Stats
    budgetStats: {
      totalBudget: 'งบประมาณทั้งหมด',
      budgetCapacity: 'ความจุงบประมาณ',
      totalBudgetFormula: 'รวม(จำนวนงบประมาณทั้งหมด)',
      totalSpend: 'ใช้จ่ายทั้งหมด',
      moneyUsed: 'เงินที่ใช้ไป',
      totalSpendFormula: 'รวม(ค่าใช้จ่ายทั้งหมด)',
      remaining: 'คงเหลือ',
      availableNow: 'มีอยู่ตอนนี้',
      remainingFormula: 'งบประมาณทั้งหมด - ใช้จ่ายทั้งหมด',
      activeBudgets: 'งบประมาณที่ใช้งาน',
      currentPlans: 'แผนปัจจุบัน',
      activeBudgetsFormula: 'นับ(บันทึกงบประมาณ)',
    },

    // Budgets Page - Density
    density: {
      compact: 'กะทัดรัด',
      comfort: 'สะดวกสบาย',
      auto: 'อัตโนมัติ',
    },

    // Create Budget Dialog
    createBudget: {
      title: 'สร้างงบประมาณใหม่',
      step1Title: 'สร้างงบประมาณ',
      step2Title: 'เพิ่มค่าใช้จ่าย',
      selectEmoji: 'เลือก Emoji',
      budgetName: 'ชื่องบประมาณ',
      scanReceipt: 'สแกนใบเสร็จ',
      createButton: 'สร้างงบประมาณ',
      createAndReviewButton: 'สร้างงบประมาณและตรวจสอบค่าใช้จ่าย',
      toasts: {
        scanSuccess: 'สแกนสำเร็จ พบ {count} รายการ — กรอกชื่อ Budget แล้วกด Create Budget',
        scanSuccessNoBudget: 'สแกนใบเสร็จสำเร็จ — กรอกชื่อ Budget แล้วกด Create Budget',
        scanFailed: 'สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        createSuccess: 'สร้างงบประมาณใหม่สำเร็จ!',
        createFailed: 'ไม่สามารถสร้างงบประมาณ กรุณาลองใหม่อีกครั้ง',
      },
    },

    // Budget Item
    budgetItem: {
      items: 'รายการ',
      spent: 'ใช้จ่าย',
      remaining: 'คงเหลือ',
      percentUsed: '% ที่ใช้',
    },

    // Edit Budget Dialog
    editBudget: {
      title: 'อัปเดตงบประมาณ',
      budgetName: 'ชื่องบประมาณ',
      budgetAmount: 'จำนวนงบประมาณ',
      defaultCategory: 'หมวดหมู่เริ่มต้น (ไม่จำเป็น)',
      syncCategory: 'ซิงค์หมวดหมู่กับค่าใช้จ่ายที่มีอยู่',
      syncTitle: 'ซิงค์ค่าใช้จ่ายที่มีอยู่?',
      syncDescription: 'นี่จะอัปเดตค่าใช้จ่ายที่มีอยู่ทั้งหมดในงบประมาณนี้เป็นหมวดหมู่ "{category}"',
      updateButton: 'อัปเดตงบประมาณ',
      confirmSync: 'ยืนยันการซิงค์',
    },

    // Expenses Page
    expensesPage: {
      title: 'วารสารค่าใช้จ่าย',
      heading: 'ค่าใช้จ่ายของฉัน',
      subtitle: 'ค้นหา กรอง และส่งออกค่าใช้จ่ายทั้งหมดได้อย่างรวดเร็ว',
    },

    // Expenses Stats
    expensesStats: {
      thisMonth: 'ใช้จ่ายเดือนนี้',
      thisMonthFormula: 'รวม(ค่าใช้จ่ายในเดือนนี้)',
      totalAmount: 'ค่าใช้จ่ายทั้งหมด',
      allRecords: 'รายการทั้งหมด',
      totalAmountFormula: 'รวม(จำนวนค่าใช้จ่ายทั้งหมด)',
      avgPerDay: 'เฉลี่ยต่อวัน',
      avgPerDayFormula: 'ยอดเดือนนี้ / จำนวนวันที่ผ่านมา',
      topCategory: 'หมวดหมู่สูงสุด',
      topCategoryFormula: 'หมวดหมู่ที่ใช้จ่ายมากที่สุด',
    },

    // Expenses [id] Page
    expensesDetailPage: {
      label: 'รายละเอียดค่าใช้จ่าย',
      heading: 'ค่าใช้จ่ายของฉัน',
      subtitle: 'จัดการรายละเอียดงบประมาณ เพิ่มค่าใช้จ่าย และรักษาข้อมูลให้เรียบร้อย',
    },

    // Add Expense
    addExpense: {
      addExpense: 'เพิ่มค่าใช้จ่าย',
      expenseName: 'ชื่อค่าใช้จ่าย',
      expenseAmount: 'จำนวนค่าใช้จ่าย',
      category: 'หมวดหมู่ (ไม่จำเป็น)',
      selectCategory: 'เลือกหมวดหมู่',
      newCategory: 'เพิ่มหมวดหมู่ใหม่',
      addNewCategory: 'เพิ่มหมวดหมู่',
      addButton: 'เพิ่มค่าใช้จ่ายใหม่',
      scanReceipt: 'สแกนใบเสร็จด้วย AI',
      scanning: 'กำลังสแกนใบเสร็จ...',
      scannedItems: 'รายการที่สแกน',
      selectedCount: 'เลือก: {count}',
      selectAll: 'เลือกทั้งหมด',
      unselectAll: 'ยกเลิกการเลือกทั้งหมด',
      addSelected: 'เพิ่มรายการที่เลือก',
      toasts: {
        scanFailed: 'สแกนใบเสร็จไม่สำเร็จ',
        scanSuccess: 'สแกนใบเสร็จสำเร็จ',
        scanRetry: 'สแกนใบเสร็จไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        noScannedItems: 'ยังไม่มีรายการที่สแกนได้',
        selectAtLeastOne: 'กรุณาเลือกรายการอย่างน้อย 1 รายการ',
        addMultipleFailed: 'เพิ่มรายการจากใบเสร็จไม่สำเร็จ',
        addSuccess: 'เพิ่มค่าใช้จ่ายสำเร็จ',
        addFailed: 'ไม่สามารถเพิ่มค่าใช้จ่าย',
      },
    },

    // Expenses Table
    expensesTable: {
      name: 'ชื่อ',
      category: 'หมวดหมู่',
      amount: 'จำนวนเงิน',
      date: 'วันที่',
      actions: 'การกระทำ',
      noResults: 'ไม่พบค่าใช้จ่าย',
      deleteConfirm: 'ลบค่าใช้จ่ายนี้?',
      deleteSuccess: 'ลบค่าใช้จ่ายสำเร็จ!',
      deleteFailed: 'ไม่สามารถลบค่าใช้จ่าย',
    },

    // Budgets Page
    budgets: {
      title: 'งบประมาณ',
      createNew: 'สร้างงบประมาณใหม่',
      noBudgets: 'ยังไม่มีงบประมาณ สร้างอันแรกเพื่อเริ่มต้น',
      budgetName: 'ชื่องบประมาณ',
      amount: 'จำนวนเงิน',
      category: 'หมวดหมู่',
      selectIcon: 'เลือกไอคอน',
      selectEmoji: 'เลือก Emoji',
      scanReceipt: 'สแกนใบเสร็จ',
      createBudget: 'สร้างงบประมาณ',
      createBudgetReview: 'สร้างงบประมาณและตรวจสอบค่าใช้จ่าย',
      addExpenses: 'เพิ่มค่าใช้จ่าย',
      reviewScanned: 'ตรวจสอบรายการที่สแกน',
      scanSuccess: 'สแกนใบเสร็จสำเร็จ!',
      aiAutoSuggest: 'AI',
      step: 'ขั้นตอน',
      of: 'จาก',
    },

    // Expense Details
    expenses: {
      title: 'ค่าใช้จ่าย',
      addNew: 'เพิ่มค่าใช้จ่ายใหม่',
      expenseName: 'ชื่อค่าใช้จ่าย',
      amount: 'จำนวนเงิน',
      category: 'หมวดหมู่',
      date: 'วันที่',
      description: 'รายละเอียด',
      noExpenses: 'ยังไม่มีค่าใช้จ่าย',
      deleteConfirm: 'คุณแน่ใจหรือว่าต้องการลบค่าใช้จ่ายนี้?',
      expenseDetails: 'รายละเอียดค่าใช้จ่าย',
      editExpense: 'แก้ไขค่าใช้จ่าย',
      scannedItems: 'รายการที่สแกน',
      selectScanned: 'เลือกรายการที่จะเพิ่ม',
    },

    // Reports Page
    reports: {
      title: 'รายงาน & วิเคราะห์',
      subtitle: 'ภาพรวมการใช้จ่ายและงบประมาณของคุณ',
      lastUpdated: 'อัปเดตล่าสุด',
      thisMonth: 'ใช้จ่ายเดือนนี้',
      fromLastMonth: 'จากเดือนก่อน',
      totalAllTime: 'ค่าใช้จ่ายทั้งหมด',
      allTransactions: 'รายการทั้งหมด',
      avgPerDay: 'เฉลี่ยต่อวัน',
      daysInMonth: 'วันในเดือนนี้',
      topCategory: 'หมวดหมู่สูงสุด',
      monthlyTrend: 'แนวโน้มการใช้จ่าย 6 เดือน',
      trendDesc: 'ยอดรวมค่าใช้จ่ายรายเดือนย้อนหลัง',
      byCategoryPie: 'การใช้จ่ายตามหมวดหมู่',
      byCategoryDesc: 'สัดส่วน top 8 หมวดหมู่ (ทุกช่วงเวลา)',
      budgetVsActual: 'งบประมาณ vs ค่าใช้จ่ายจริง',
      budgetVsActualDesc: 'เปรียบเทียบงบที่ตั้งไว้กับยอดที่ใช้จริงในแต่ละ Budget',
      budgetPerformance: 'สรุปผลแต่ละ Budget',
      budget: 'งบประมาณ',
      budgetAmount: 'งบประมาณ',
      actualSpent: 'ใช้จ่ายจริง',
      remaining: 'คงเหลือ',
      ratio: 'สัดส่วน',
      noExpenseData: 'ยังไม่มีข้อมูลค่าใช้จ่าย',
      noBudgetData: 'ยังไม่มีข้อมูล Budget',
    },

    // Admin Page
    admin: {
      title: 'แดชบอร์ดมอนิเตอร์ผู้ดูแลระบบ',
      subtitle: 'ติดตามคุณภาพข้อมูลและกิจกรรมของแอปในที่เดียว',
      filters: {
        allTime: 'ทุกช่วงเวลา',
        last7Days: '7 วันที่ผ่านมา',
        last30Days: '30 วันที่ผ่านมา',
        thisMonth: 'เดือนนี้',
        customRange: 'กำหนดช่วงเอง',
        allUsers: 'ผู้ใช้ทั้งหมด',
        allCategories: 'ทุกหมวดหมู่',
      },
      cards: {
        totalUsers: 'ผู้ใช้ทั้งหมด',
        totalBudgets: 'งบประมาณทั้งหมด',
        totalExpenses: 'ค่าใช้จ่ายทั้งหมด',
        totalSpend: 'ใช้จ่ายรวม',
        avgExpense: 'ค่าใช้จ่ายเฉลี่ยต่อรายการ',
      },
      alerts: {
        title: 'ศูนย์แจ้งเตือน',
        noAlerts: 'ไม่มีแจ้งเตือนค้างอยู่',
        ack: 'รับทราบ',
        unack: 'ยกเลิกรับทราบ',
      },
      audit: {
        title: 'บันทึกเหตุการณ์',
        empty: 'ไม่พบเหตุการณ์ในช่วงเวลาที่เลือก',
      },
      workbench: {
        title: 'เครื่องมือจัดการคุณภาพข้อมูล',
        run: 'ดำเนินการ',
        fixMissingCategory: 'ตั้งหมวดหมู่ที่ว่างเป็น Uncategorized',
        deleteInvalidAmount: 'ลบรายการที่จำนวนเงินไม่ถูกต้อง',
        removeDuplicates: 'ลบรายการที่อาจซ้ำ',
        confirmTitle: 'ยืนยันการลบ',
        confirmInvalid: 'การกระทำนี้จะลบรายการจำนวนเงินไม่ถูกต้องทั้งหมดในตัวกรองปัจจุบันแบบถาวร',
        confirmDuplicate: 'การกระทำนี้จะลบรายการที่อาจซ้ำทั้งหมดในตัวกรองปัจจุบันแบบถาวร',
      },
      monitoring: {
        title: 'มอนิเตอร์คุณภาพข้อมูล',
        missingCategory: 'รายการที่ไม่มีหมวดหมู่',
        invalidAmount: 'จำนวนเงินไม่ถูกต้อง',
        duplicates: 'รายการซ้ำที่อาจผิดปกติ',
        budgetsOverLimit: 'งบที่ใช้เกินวงเงิน',
        txThisMonth: 'ธุรกรรมเดือนนี้',
        alert: 'พบข้อมูลที่อาจผิดปกติ กรุณาตรวจสอบและแก้ไขเพื่อให้รายงานแม่นยำ',
      },
      recent: {
        title: 'กิจกรรมค่าใช้จ่ายล่าสุด',
        name: 'ชื่อรายการ',
        category: 'หมวดหมู่',
        amount: 'จำนวนเงิน',
        date: 'วันที่',
        empty: 'ยังไม่พบกิจกรรม',
      },
    },

    adminUsers: {
      title: 'ภาพรวมผู้ใช้สำหรับแอดมิน',
      subtitle: 'สรุปกิจกรรมงบประมาณและการใช้จ่ายระดับผู้ใช้',
      detail: {
        title: 'เจาะลึกรายผู้ใช้',
        selectUser: 'เลือกผู้ใช้จากตารางเพื่อดูรายละเอียด',
        recentExpenses: 'ค่าใช้จ่ายล่าสุด',
      },
      columns: {
        email: 'อีเมล',
        budgets: 'จำนวนงบ',
        expenses: 'จำนวนรายการ',
        totalBudget: 'งบรวม',
        totalSpend: 'ใช้จ่ายรวม',
      },
      empty: 'ยังไม่พบกิจกรรมผู้ใช้',
    },

    adminDatabase: {
      title: 'จัดการฐานข้อมูล',
      subtitle: 'ภาพรวมข้อมูลจากฐานข้อมูลแบบอ่านอย่างเดียวสำหรับผู้ดูแล',
      readOnlyNote: 'หน้านี้เป็นแบบอ่านอย่างเดียวโดยตั้งใจ หากต้องการแก้ข้อมูลให้ใช้ admin actions และ workbench เพื่อให้มีการควบคุมและมี audit log',
      searchPlaceholder: 'ค้นหาในตารางปัจจุบัน...',
      empty: 'ไม่พบข้อมูล',
      detail: {
        title: 'รายละเอียดเรคคอร์ด',
        subtitle: 'ตรวจดูทุกฟิลด์ของข้อมูลที่เลือกจาก',
        field: 'ฟิลด์',
        value: 'ค่า',
        copyJson: 'คัดลอก JSON',
        copySuccess: 'คัดลอก JSON ของเรคคอร์ดแล้ว',
        copyError: 'คัดลอก JSON ไม่สำเร็จ',
      },
      pagination: {
        showing: 'แสดง',
        of: 'จาก',
        filteredFrom: 'จากจำนวนแถวทั้งหมด',
        rowsPerPage: 'แถวต่อหน้า',
        previous: 'ก่อนหน้า',
        next: 'ถัดไป',
        page: 'หน้า',
      },
      views: {
        budgets: 'งบประมาณ',
        expenses: 'ค่าใช้จ่าย',
        alerts: 'แจ้งเตือน',
        audit: 'บันทึกระบบ',
      },
      cards: {
        users: 'ผู้ใช้',
        budgets: 'งบประมาณ',
        expenses: 'ค่าใช้จ่าย',
        activeAlerts: 'แจ้งเตือนค้างอยู่',
        auditEvents: 'เหตุการณ์ระบบ',
      },
      columns: {
        name: 'ชื่อ',
        category: 'หมวดหมู่',
        owner: 'เจ้าของ',
        amount: 'จำนวนเงิน',
        spend: 'ใช้จ่าย',
        items: 'รายการ',
        budget: 'Budget',
        date: 'วันที่',
        key: 'คีย์',
        status: 'สถานะ',
        actor: 'ผู้กระทำ',
        action: 'การกระทำ',
        message: 'ข้อความ',
      },
    },

    // Stat Card
    statCard: {
      thisMonth: 'เดือนนี้',
    },

    // Card Info
    cardInfo: {
      totalBudget: 'งบประมาณทั้งหมด',
      totalSpending: 'ใช้จ่ายทั้งหมด',
      activeBudgets: 'งบประมาณที่ใช้งาน',
    },

    // Edit Budget
    editBudgetTitle: 'แก้ไขงบประมาณ',
    updateSuccess: 'อัปเดตงบประมาณสำเร็จ',
    updateError: 'ไม่สามารถอัปเดตงบประมาณ',

    // Categories (expenses)
    categories: {
      food: 'อาหาร & ร้านอาหาร',
      transport: 'การขนส่ง',
      shopping: 'ช้อปปิ้ง',
      entertainment: 'ความบันเทิง',
      utilities: 'ค่าสาธารณูปโภค',
      health: 'สุขภาพ & การแพทย์',
      education: 'การศึกษา',
      housing: 'ที่อยู่อาศัย',
      beauty: 'ความงาม & ดูแลส่วนบุคคล',
      fitness: 'ฟิตเนส',
      travel: 'การเดินทาง',
      technology: 'เทคโนโลยี',
      finance: 'การเงิน & ประกันภัย',
      pets: 'สัตว์เลี้ยง',
      baby: 'เด็ก & ผู้เยาว์',
      gifts: 'ของขวัญ & บริจาค',
      work: 'งาน & วิชาชีพ',
      uncategorized: 'ไม่ระบุหมวดหมู่',
    },

    // Dialogs & Modals
    dialogs: {
      confirmDelete: 'ยืนยันการลบ',
      deleteMessage: 'คุณแน่ใจหรือว่าต้องการลบสิ่งนี้?',
      deleteConfirm: 'ใช่ ลบเลย',
      cancel: 'ยกเลิก',
    },

    // Messages
    messages: {
      success: 'สำเร็จ',
      error: 'ข้อผิดพลาด',
      loading: 'กำลังโหลด...',
      tryAgain: 'ลองอีกครั้ง',
    },

    // Auth Pages (if any)
    auth: {
      signIn: 'เข้าสู่ระบบ',
      signUp: 'สมัครสมาชิก',
      signOut: 'ออกจากระบบ',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
    },
  },
}

export function getTranslation(lang, key) {
  const keys = key.split('.')
  let value = translations[lang]

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      return key // fallback to key if not found
    }
  }

  return value || key
}
