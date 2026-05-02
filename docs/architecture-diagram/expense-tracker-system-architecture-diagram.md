# Architecture Diagram

เอกสารนี้ใช้สำหรับอธิบายภาพรวมสถาปัตยกรรมโครงสร้างพื้นฐานของระบบ Expense Tracker System ในบริบท Infrastructure และ DevOps โดยแสดงองค์ประกอบหลักของระบบและขอบเขตการทำงานของแต่ละชั้นบริการ

## ภาพแผนภาพสถาปัตยกรรม

1. [Architecture Diagram (PNG)](./Architecture%20Diagram.drawio.png)

## คำอธิบายโดยสรุป

1. ผู้ใช้งานจากภายนอกเข้าถึงระบบผ่าน Cloudflare Edge และนโยบายการเข้าถึง
2. ทราฟฟิกถูกส่งผ่าน cloudflared Tunnel เข้าสู่ระบบภายใน
3. Nginx Proxy Manager ทำหน้าที่ Reverse Proxy และส่งต่อคำขอไปยังบริการปลายทาง
4. แอปพลิเคชันหลักรันบนคอนเทนเนอร์ใน CT101 และเชื่อมต่อฐานข้อมูล MariaDB ใน CT105
5. โครงสร้างทั้งหมดทำงานบน Proxmox VE ในสภาพแวดล้อม Homelab
