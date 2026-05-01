# Multi-stage Dockerfile for optimized Next.js production images:
# base -> deps -> builder -> runner
# Dockerfile นี้ใช้แนวทาง multi-stage เพื่อลดขนาด image ตอนใช้งานจริง
# ลำดับ stage: base -> deps -> builder -> runner

# Notes:
# - `next.config.mjs` uses `output: 'standalone'`, so runtime files are emitted
#   under `.next/standalone` and copied in the runner stage.
# - Install dependencies before copying full source to maximize Docker layer cache hits.
# - Keep runtime image minimal: no dev deps, no source tree, only built assets.
# หมายเหตุ:
# - โปรเจกต์ตั้งค่า standalone output จึงคัดลอกไฟล์ที่จำเป็นไป stage สุดท้ายได้
# - ลง dependencies ก่อนค่อย copy source ทั้งหมด เพื่อใช้ cache ได้ดีขึ้น
# - stage runtime ควรเล็กที่สุด (ไม่มี dev deps และไม่มีซอร์สที่ไม่จำเป็น)

# --- STAGE 1: Base Image ---
# Stage พื้นฐาน: ใช้ image หลักร่วมกันทุก stage
FROM node:20-alpine AS base
# Add libc6-compat for compatibility with certain libraries (like sharp or bcrypt)
# ติดตั้งไลบรารีเสริมเพื่อรองรับบางแพ็กเกจเนทีฟ
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- STAGE 2: Install Dependencies ---
# Stage dependencies: ติดตั้งแพ็กเกจตาม lockfile
FROM base AS deps
# Copy package files to install dependencies first (leverages Docker cache)
# copy เฉพาะไฟล์แพ็กเกจก่อน เพื่อให้ชั้น cache ใช้งานซ้ำได้
COPY package.json package-lock.json ./
# Use deterministic install based on lockfile for reproducible builds.
# ใช้ npm ci เพื่อให้ผลลัพธ์ตรงตาม lockfile ทุกครั้ง
RUN npm ci

# --- STAGE 3: Builder ---
# Stage build: คอมไพล์/บิลด์แอป Next.js
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
# นำ node_modules ที่ติดตั้งแล้วจาก stage ก่อนหน้าเข้ามาใช้
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
# คัดลอกซอร์สทั้งหมดเพื่อเตรียม build
COPY . .

# Build-time Arguments (Clerk Auth)
# These must be provided during the build process to be embedded in the JS
# ค่าพวก NEXT_PUBLIC_* ต้องส่งมาตอน build เพื่อฝังลง bundle ฝั่ง client
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL

# Set Environment Variables for the build process
# ทำให้ค่าพร้อมใช้งานระหว่างคำสั่ง build
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL

# Build the Next.js application
# สร้างไฟล์ production build ของ Next.js
RUN npm run build

# --- STAGE 4: Runner (Production Image) ---
# Stage runtime: เก็บเฉพาะไฟล์ที่ต้องใช้จริงตอนรัน
FROM base AS runner
WORKDIR /app

# Runtime-only envs consumed by Next.js standalone server.
# ตัวแปรแวดล้อมสำหรับการรันจริง
ENV NODE_ENV=production
# Allow the app to be accessible outside the container
# ให้เซิร์ฟเวอร์ฟังบนทุก network interface ภายในคอนเทนเนอร์
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy only necessary files from the builder stage
# คัดลอกเฉพาะไฟล์ที่จำเป็นจาก stage build
COPY --from=builder /app/public ./public
# Standalone mode copies only the code and modules needed for production
# โหมด standalone จะรวมเฉพาะโค้ด/โมดูลที่ต้องใช้จริง
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# App listens on container port 3000; host mapping is defined in compose.
# เปิดพอร์ตภายในคอนเทนเนอร์
EXPOSE 3000

# Run the server using Node directly (fastest and lightest way)
# เริ่มเซิร์ฟเวอร์จากไฟล์ standalone ที่ build แล้ว
CMD ["node", "server.js"]