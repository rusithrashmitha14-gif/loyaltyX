#!/bin/bash

# LoyaltyX Production Setup Script
# This script helps automate the initial production setup

set -e  # Exit on error

echo "🚀 LoyaltyX Production Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}!${NC} $1"
}

info() {
    echo -e "ℹ $1"
}

# Check if required commands exist
check_requirements() {
    info "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        error "openssl is not installed. Please install openssl first."
        exit 1
    fi
    
    success "All requirements met"
}

# Generate secure secrets
generate_secrets() {
    info "Generating secure secrets..."
    
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 32)
    AUTH_SECRET=$(openssl rand -base64 32)
    
    success "Secrets generated"
}

# Create .env file
create_env_file() {
    echo ""
    info "Creating .env file..."
    
    if [ -f .env ]; then
        warning ".env file already exists"
        read -p "Do you want to overwrite it? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            warning "Skipping .env creation"
            return
        fi
    fi
    
    # Get user input
    read -p "Enter your DATABASE_URL: " DATABASE_URL
    read -p "Enter your production domain (e.g., https://loyaltyx.vercel.app): " NEXTAUTH_URL
    
    # Create .env file
    cat > .env << EOF
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="${DATABASE_URL}"

# ===========================================
# NEXTAUTH
# ===========================================
NEXTAUTH_URL="${NEXTAUTH_URL}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================
AUTH_SECRET="${AUTH_SECRET}"
JWT_SECRET="${JWT_SECRET}"

# ===========================================
# APPLICATION
# ===========================================
NODE_ENV="production"
NEXT_PUBLIC_API_URL="${NEXTAUTH_URL}/api"

# ===========================================
# MONITORING (OPTIONAL)
# ===========================================
# SENTRY_DSN="your_sentry_dsn_here"

# ===========================================
# RATE LIMITING (OPTIONAL)
# ===========================================
# UPSTASH_REDIS_REST_URL=""
# UPSTASH_REDIS_REST_TOKEN=""
EOF
    
    success ".env file created"
}

# Install dependencies
install_dependencies() {
    echo ""
    info "Installing dependencies..."
    npm ci
    success "Dependencies installed"
}

# Generate Prisma client
generate_prisma() {
    echo ""
    info "Generating Prisma client..."
    npx prisma generate
    success "Prisma client generated"
}

# Deploy migrations
deploy_migrations() {
    echo ""
    warning "Ready to deploy migrations to production database"
    read -p "Do you want to deploy migrations now? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Deploying migrations..."
        npx prisma migrate deploy
        success "Migrations deployed"
    else
        warning "Skipping migration deployment. Run 'npx prisma migrate deploy' manually when ready."
    fi
}

# Build application
build_app() {
    echo ""
    info "Building application..."
    npm run build
    success "Build successful"
}

# Display environment variables for Vercel
show_vercel_vars() {
    echo ""
    echo "================================"
    echo "📋 Environment Variables for Vercel"
    echo "================================"
    echo ""
    echo "Copy these to your Vercel dashboard:"
    echo ""
    echo "DATABASE_URL=${DATABASE_URL}"
    echo "NEXTAUTH_URL=${NEXTAUTH_URL}"
    echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"
    echo "JWT_SECRET=${JWT_SECRET}"
    echo "AUTH_SECRET=${AUTH_SECRET}"
    echo "NEXT_PUBLIC_API_URL=${NEXTAUTH_URL}/api"
    echo "NODE_ENV=production"
    echo ""
    echo "Optional (add later):"
    echo "SENTRY_DSN=your_sentry_dsn_here"
    echo "UPSTASH_REDIS_REST_URL=your_upstash_url"
    echo "UPSTASH_REDIS_REST_TOKEN=your_upstash_token"
    echo ""
}

# Run security checks
run_security_checks() {
    echo ""
    info "Running security checks..."
    
    # Check for common issues
    if grep -r "console.log" src/app/api --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
        warning "Found console.log statements in API routes (consider removing for production)"
    fi
    
    if [ -f .env ] && git ls-files --error-unmatch .env > /dev/null 2>&1; then
        error ".env file is tracked by git! Add it to .gitignore immediately!"
    else
        success "No .env file in git tracking"
    fi
    
    # Run npm audit
    info "Running npm audit..."
    npm audit --audit-level=moderate || warning "Found vulnerabilities. Run 'npm audit fix' to resolve."
    
    success "Security checks complete"
}

# Main setup flow
main() {
    check_requirements
    
    echo ""
    echo "This script will help you set up LoyaltyX for production deployment."
    echo ""
    
    generate_secrets
    create_env_file
    install_dependencies
    generate_prisma
    deploy_migrations
    build_app
    run_security_checks
    show_vercel_vars
    
    echo ""
    echo "================================"
    success "Setup complete!"
    echo "================================"
    echo ""
    echo "Next steps:"
    echo "1. Add environment variables to Vercel (see above)"
    echo "2. Push your code to GitHub"
    echo "3. Deploy to Vercel"
    echo "4. Test your production deployment"
    echo "5. Review the production checklist: docs/PRODUCTION_CHECKLIST.md"
    echo ""
    echo "For detailed deployment instructions, see: DEPLOYMENT.md"
    echo ""
}

# Run main function
main




