# Sequence Diagram

เอกสารนี้รวบรวมแผนภาพลำดับการทำงาน (Sequence Diagram) ของระบบใน 2 มุมมองหลัก ได้แก่ การเข้าถึงระบบจากภายนอก และกระบวนการ Deploy

## รายการแผนภาพ

1. [Sequence Diagram การเข้าถึงระบบจากภายนอก (PNG)](./Sequence%20Diagram%20การเข้าถึงระบบจากภายนอก.drawio.png)
2. [Sequence Diagram กระบวนการ Deploy (PNG)](./Sequence%20Diagram%20กระบวนการ%20Deploy.drawio.png)

## คำอธิบายโดยสรุป

1. แผนภาพการเข้าถึงระบบจากภายนอกแสดงลำดับคำขอตั้งแต่ User จนถึง Database และการตอบกลับ
2. แผนภาพกระบวนการ Deploy แสดงลำดับการทำงานของ Admin, deploy.sh, Docker Compose, GitHub, Docker Engine และ Discord Webhook
3. ใช้เส้นทึบสำหรับคำขอหลัก และเส้นประสำหรับการตอบกลับหรือผลลัพธ์ของขั้นตอน
