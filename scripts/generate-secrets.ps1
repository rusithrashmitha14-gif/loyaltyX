# ============================================
# LoyaltyX - Production Secrets Generator (PowerShell)
# ============================================
# This script generates secure random secrets for production deployment
# Run this before deploying to Vercel

Write-Host "🔐 LoyaltyX Production Secrets Generator" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy these values to your Vercel Environment Variables:" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ NEXTAUTH_SECRET:" -ForegroundColor Green
$secret1 = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$base64Secret1 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($secret1))
Write-Host $base64Secret1
Write-Host ""

Write-Host "✅ JWT_SECRET:" -ForegroundColor Green
$secret2 = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$base64Secret2 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($secret2))
Write-Host $base64Secret2
Write-Host ""

Write-Host "✅ AUTH_SECRET:" -ForegroundColor Green
$secret3 = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$base64Secret3 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($secret3))
Write-Host $base64Secret3
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "⚠️  IMPORTANT REMINDERS:" -ForegroundColor Yellow
Write-Host "  1. Never commit these secrets to git"
Write-Host "  2. Add these to Vercel → Settings → Environment Variables"
Write-Host "  3. Rotate these secrets monthly in production"
Write-Host "  4. Keep a secure backup of these values"
Write-Host "==========================================" -ForegroundColor Cyan


