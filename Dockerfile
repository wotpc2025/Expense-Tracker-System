# Multi-stage Dockerfile for optimized Next.js production images:
# base -> deps -> builder -> runner

# Notes:
# - `next.config.mjs` uses `output: 'standalone'`, so runtime files are emitted
#   under `.next/standalone` and copied in the runner stage.
# - Install dependencies before copying full source to maximize Docker layer cache hits.
# - Keep runtime image minimal: no dev deps, no source tree, only built assets.

# --- STAGE 1: Base Image ---
FROM node:20-alpine AS base
# Add libc6-compat for compatibility with certain libraries (like sharp or bcrypt)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- STAGE 2: Install Dependencies ---
FROM base AS deps
# Copy package files to install dependencies first (leverages Docker cache)
COPY package.json package-lock.json ./
# Use deterministic install based on lockfile for reproducible builds.
RUN npm ci

# --- STAGE 3: Builder ---
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files
COPY . .

# Build-time Arguments (Clerk Auth)
# These must be provided during the build process to be embedded in the JS
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL

# Set Environment Variables for the build process
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL

# Build the Next.js application
RUN npm run build

# --- STAGE 4: Runner (Production Image) ---
FROM base AS runner
WORKDIR /app

# Runtime-only envs consumed by Next.js standalone server.
ENV NODE_ENV=production
# Allow the app to be accessible outside the container
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Copy only necessary files from the builder stage
COPY --from=builder /app/public ./public
# Standalone mode copies only the code and modules needed for production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# App listens on container port 3000; host mapping is defined in compose.
EXPOSE 3000

# Run the server using Node directly (fastest and lightest way)
CMD ["node", "server.js"]