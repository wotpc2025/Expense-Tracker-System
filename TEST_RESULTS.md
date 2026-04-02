# Test Results Summary

Date: 2026-04-02
Command: npm run test
Framework: Vitest

## Automated Test Table

| ID | Test Case | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- |
| T001 | Parse money with comma format (`1,250.50`) | Parsed as numeric 1250.5 | 1250.5 | Pass |
| T002 | Reject invalid money input (`abc`) | Return null | null | Pass |
| T003 | Allow zero when configured | Return 0 | 0 | Pass |
| T004 | Parse date `DD/MM/YYYY` | Date object with correct ISO day | `2026-04-02` | Pass |
| T005 | Parse date `YYYY-MM-DD` | Date object with correct ISO day | `2026-04-02` | Pass |
| T006 | Reject invalid date | Return null | null | Pass |

## Execution Output

- Test files: 1 passed
- Test cases: 6 passed
- Duration: 504ms
