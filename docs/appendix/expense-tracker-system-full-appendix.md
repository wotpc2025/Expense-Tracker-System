# ภาคผนวกฉบับเต็มของโครงงาน

เอกสารฉบับนี้จัดทำขึ้นเพื่อรวบรวมภาคผนวกและเอกสารประกอบเชิงเทคนิคของโครงงานในจุดเดียว เพื่อให้สามารถเข้าถึงรายละเอียดเพิ่มเติมจากรายงานฉบับหลักได้สะดวกยิ่งขึ้น โดยเนื้อหาในเอกสารนี้ครอบคลุมทั้งด้านโครงสร้างข้อมูล การออกแบบระบบ แผนภาพประกอบ และเอกสารด้านการปฏิบัติการของระบบ

## 1. พจนานุกรมข้อมูลและโครงสร้างข้อมูล

เอกสารในหมวดนี้ใช้สำหรับอธิบายโครงสร้างข้อมูลของระบบ ตารางข้อมูล ความหมายของแต่ละฟิลด์ และความสัมพันธ์ของข้อมูลภายในระบบ

1. [ภาคผนวก ก พจนานุกรมข้อมูลของระบบ](./expense-tracker-system-appendix-a-data-dictionary.md)
2. [เอกสาร ER Diagram](../er-diagram/expense-tracker-system-er-diagram.md)

## 2. เอกสารแผนภาพระบบ

เอกสารในหมวดนี้ใช้สำหรับอธิบายภาพรวมของสถาปัตยกรรม ระบบเครือข่าย และองค์ประกอบที่เกี่ยวข้องกับการทำงานของโครงงาน

1. [คำอธิบาย System Diagram](../system-diagrams/expense-tracker-system-system-diagram-description.md)
2. [ไฟล์ System Diagram แบบ XML](../system-diagrams/expense-tracker-system-system-diagram.xml)
3. [เอกสาร Use Case Diagram](../use-case/expense-tracker-system-use-case.md)
4. [ไฟล์ Use Case Diagram แบบ PlantUML](../use-case/expense-tracker-system-use-case.puml)
5. [เอกสาร Architecture Diagram](../architecture-diagram/expense-tracker-system-architecture-diagram.md)
6. [เอกสาร Request Flow Diagram](../flow-diagram/expense-tracker-system-request-flow-diagram.md)
7. [เอกสาร Deploy Flowchart](../deploy-flowchart/expense-tracker-system-deploy-flowchart.md)

## 3. เอกสาร Activity Diagram

เอกสารในหมวดนี้ใช้สำหรับอธิบายลำดับการทำงานของกรณีใช้งานหลักในระบบ Expense Tracker System

1. [สรุป Activity Diagram ของระบบ](../activity-diagrams/expense-tracker-system-activity-diagram.md)
2. [โฟลเดอร์ไฟล์ Activity Diagram ทั้งหมด](../activity-diagrams/expense-tracker-system/)

รายการ Activity Diagram รายกรณีใช้งานประกอบด้วย

1. [UC01 Sign Up](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc01-sign-up.puml)
2. [UC02 Sign In](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc02-sign-in.puml)
3. [UC03 Dashboard Overview](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc03-dashboard-overview.puml)
4. [UC04 Create Budget](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc04-create-budget.puml)
5. [UC05 Edit/Delete Budget](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc05-edit-delete-budget.puml)
6. [UC06 Add Expense](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc06-add-expense.puml)
7. [UC07 Edit/Delete Expense](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc07-edit-delete-expense.puml)
8. [UC08 Upload Receipt AI Scan](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc08-upload-receipt-ai-scan.puml)
9. [UC09 Confirm Scan Result](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc09-confirm-scan-result.puml)
10. [UC10 Reports Statistics](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc10-reports-statistics.puml)
11. [UC11 Export CSV/PDF](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc11-export-csv-pdf.puml)
12. [UC12 Admin Check Users](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc12-admin-check-users.puml)
13. [UC13 Admin Check Budgets/Expenses](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc13-admin-check-budgets-expenses.puml)
14. [UC14 Admin Check Alerts](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc14-admin-check-alerts.puml)
15. [UC15 Admin Check Audit Log](../activity-diagrams/expense-tracker-system/expense-tracker-system-activity-uc15-admin-check-audit-log.puml)

## 4. เอกสาร Sequence Diagram

เอกสารในหมวดนี้ใช้สำหรับอธิบายลำดับการทำงานของระบบในมุมการเข้าถึงจากภายนอกและกระบวนการ Deploy

1. [เอกสาร Sequence Diagram (รวม)](../sequence-diagram/expense-tracker-system-sequence-diagram.md)
2. [Sequence Diagram การเข้าถึงระบบจากภายนอก](../sequence-diagram/Sequence%20Diagram%20การเข้าถึงระบบจากภายนอก.drawio.png)
3. [Sequence Diagram กระบวนการ Deploy](../sequence-diagram/Sequence%20Diagram%20กระบวนการ%20Deploy.drawio.png)

## 5. เอกสารด้านการปฏิบัติการและการ Deploy

เอกสารในหมวดนี้ใช้สำหรับอธิบายขั้นตอนการดำเนินงาน การ Deploy และแนวทางปฏิบัติการของระบบในสภาพแวดล้อมจริง

1. [Operations Runbook สำหรับ Deployment](../operations/expense-tracker-system-operations-runbook-deployment.md)

## 6. หมายเหตุการใช้งานเอกสาร

1. เอกสารฉบับนี้จัดทำขึ้นเพื่อใช้เป็นภาคผนวกฉบับเต็มสำหรับอ้างอิงจากรายงานฉบับหลัก
2. หากนำเอกสารนี้ไปใช้งานผ่าน GitHub แนะนำให้คัดลอกลิงก์ของไฟล์นี้ไปใส่ในรายงาน Word เพื่อให้ผู้อ่านเข้าถึงรายละเอียดทั้งหมดได้จากหน้าเดียว
3. หากมีการเพิ่มเอกสารใหม่ในโครงงาน ควรอัปเดตรายการในไฟล์นี้เพื่อให้สารบัญของภาคผนวกเป็นปัจจุบันอยู่เสมอ