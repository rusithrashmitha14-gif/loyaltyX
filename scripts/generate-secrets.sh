#!/bin/bash

# ============================================
# LoyaltyX - Production Secrets Generator
# ============================================
# This script generates secure random secrets for production deployment
# Run this before deploying to Vercel

echo "🔐 LoyaltyX Production Secrets Generator"
echo "=========================================="
echo ""
echo "Copy these values to your Vercel Environment Variables:"
echo ""

echo "✅ NEXTAUTH_SECRET:"
openssl rand -base64 32
echo ""

echo "✅ JWT_SECRET:"
openssl rand -base64 32
echo ""

echo "✅ AUTH_SECRET:"
openssl rand -base64 32
echo ""

echo "=========================================="
echo "⚠️  IMPORTANT REMINDERS:"
echo "  1. Never commit these secrets to git"
echo "  2. Add these to Vercel → Settings → Environment Variables"
echo "  3. Rotate these secrets monthly in production"
echo "  4. Keep a secure backup of these values"
echo "=========================================="


