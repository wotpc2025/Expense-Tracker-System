#!/bin/bash

# Automated deployment script for a Dockerized Next.js app.
# Flow: notify start -> down -> git pull -> build -> up -> prune -> notify success.
#
# Operational assumptions:
# - Script runs from repository root on target host.
# - `docker compose` and `git` are installed and authenticated.
# - Required runtime secrets exist in `.env` for compose.

# --- Configuration Section ---
# Replace with your actual Discord Webhook URL
DISCORD_WEBHOOK="https://discord.com/api/webhooks/1458014314060451967/HYV_l6rHtEEiTpMX2YMaaQE0sWNAGBbWmgByZEhBEJhNp0O7XeYre8tYj7Ba_ic0E0Vb"
# Define your project name for identification in Discord notifications
PROJECT_NAME="Expense-Tracker-App" 
# -----------------------------

# Exit immediately if any command exits with a non-zero status (error)
set -e

# Optional: enable trace logs by uncommenting the next line when debugging.
# set -x

# Function to send embedded messages to Discord using a Webhook
# Parameters: $1 = Decimal Color, $2 = Title, $3 = Description
send_discord_msg() {
    local color="$1"
    local title="$2"
    local desc="$3"
    
    curl -H "Content-Type: application/json" \
         -X POST \
         -d '{
            "embeds": [{
                "title": "'"$title"'",
                "description": "'"$desc"'",
                "color": '"$color"'
            }]
         }' "$DISCORD_WEBHOOK"
}

# Error Handling: Execute this trap if any command fails (ERR signal)
trap 'send_discord_msg 16711680 "❌ Deployment Failed!" "Project: '"$PROJECT_NAME"'\nStep: An error occurred during deployment. Check Proxmox logs for details."' ERR

# Notification: Notify Discord that the deployment has started
echo "🚀 Starting Deployment Process..."
send_discord_msg 3447003 "⏳ Deployment Started" "Starting update for '"$PROJECT_NAME"' on Proxmox..."

# Step 1: Stop and remove existing containers and networks defined in compose.
echo "🛑 Step 1: Stopping current containers..."
docker compose down

# Step 2: Fetch latest source code.
echo "📥 Step 2: Pulling latest code..."
# If local changes exist on server, this command can fail and trigger ERR trap.
git pull origin main

# Step 3: Build/rebuild service images from current source.
echo "🏗️  Step 3: Building Docker images..."
# Build uses docker-compose.yml and Dockerfile from current working tree.
docker compose build

# Step 4: Start containers in detached mode.
echo "🚢 Step 4: Starting new containers..."
docker compose up -d

# Step 5: Cleanup old images/build cache to keep disk usage under control.
echo "🧹 Step 5: Cleaning up unused Docker data..."
# `image prune` removes dangling images; `builder prune` removes old build cache.
docker image prune -f
docker builder prune -f --filter "until=24h"

# Step 6: Final success notification
echo "🎉 Deployment Completed!"
send_discord_msg 65280 "✅ Deployment Successful!" "Project: '"$PROJECT_NAME"'\nStatus: Everything is up and running successfully on Proxmox lxc container!"