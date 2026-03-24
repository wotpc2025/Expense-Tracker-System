# 1. Base image
FROM node:20-alpine AS base

# 2. Install dependencies (เฉพาะตอน build)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ใส่ ARG/ENV สำหรับ Clerk (จาก Dockerfile อันที่ 1 ของคุณ)
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

RUN npm run build

# 4. Runner (Image จริงที่ใช้ Deploy - จะเล็กมาก)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy เฉพาะไฟล์ที่จำเป็นจาก Standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# รันด้วย node โดยตรง (ไม่ต้องใช้ npm start ช่วยประหยัด Ram)
CMD ["node", "server.js"]