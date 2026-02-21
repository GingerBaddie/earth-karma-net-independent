#!/bin/bash

# Supabase Setup Helper Script
# This script helps you set up your Supabase project

set -e

echo "🌱 EcoTrack - Supabase Setup Helper"
echo "===================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating template..."
    cat > .env << 'EOF'
# Get these values from https://supabase.com/dashboard
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_URL="https://your_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
GOOGLE_AI_KEY="your_google_ai_key"
EOF
    echo "✅ .env template created. Please fill in your values."
    echo ""
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI not found. Installing..."
    npm install -g supabase
    echo "✅ Supabase CLI installed"
    echo ""
fi

# Extract values from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Menu
echo "What would you like to do?"
echo "1. Login to Supabase"
echo "2. Link to your Supabase project"
echo "3. Run database migrations"
echo "4. Deploy Edge Functions"
echo "5. Create admin user via Edge Function"
echo "6. Pull database changes"
echo "7. Generate TypeScript types"
echo "8. Full setup (1-7)"
echo ""
read -p "Choose option (1-8): " choice

case $choice in
    1)
        echo "🔐 Logging in to Supabase..."
        supabase login
        ;;
    2)
        echo "🔗 Linking to Supabase project..."
        if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
            read -p "Enter your Supabase Project ID: " PROJECT_ID
        else
            PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
        fi
        supabase link --project-id $PROJECT_ID
        echo "✅ Project linked!"
        ;;
    3)
        echo "📊 Running database migrations..."
        supabase db push
        echo "✅ Migrations applied!"
        ;;
    4)
        echo "⚡ Deploying Edge Functions..."
        supabase functions deploy verify-activity-image --no-verify-jwt
        supabase functions deploy seed-admin --no-verify-jwt
        supabase functions deploy manage-user-status --no-verify-jwt
        echo "✅ Edge Functions deployed!"
        ;;
    5)
        echo "👤 Creating admin user..."
        if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
            echo "❌ Missing SUPABASE_URL or PUBLISHABLE_KEY in .env"
            exit 1
        fi
        curl -X POST "${VITE_SUPABASE_URL}/functions/v1/seed-admin" \
            -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
            -H "Content-Type: application/json"
        echo "✅ Admin user created!"
        ;;
    6)
        echo "📥 Pulling database changes..."
        supabase db pull
        echo "✅ Changes pulled!"
        ;;
    7)
        echo "📝 Generating TypeScript types..."
        supabase gen types typescript --project-id $VITE_SUPABASE_PROJECT_ID > src/integrations/supabase/types.ts
        echo "✅ Types generated!"
        ;;
    8)
        echo "🚀 Starting full setup..."
        echo ""
        
        # Step 1: Login
        echo "Step 1/7: Login to Supabase"
        supabase login
        echo ""
        
        # Step 2: Link
        echo "Step 2/7: Link to project"
        if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
            read -p "Enter your Supabase Project ID: " PROJECT_ID
        else
            PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
        fi
        supabase link --project-id $PROJECT_ID
        echo ""
        
        # Step 3: Migrations
        echo "Step 3/7: Run migrations"
        supabase db push
        echo ""
        
        # Step 4: Deploy functions
        echo "Step 4/7: Deploy Edge Functions"
        supabase functions deploy verify-activity-image --no-verify-jwt
        supabase functions deploy seed-admin --no-verify-jwt
        supabase functions deploy manage-user-status --no-verify-jwt
        echo ""
        
        # Step 5: Create admin
        echo "Step 5/7: Create admin user"
        echo "⚠️  Make sure you've configured ADMIN_EMAIL and ADMIN_PASSWORD in Supabase secrets!"
        read -p "Press Enter to continue..."
        curl -X POST "${VITE_SUPABASE_URL}/functions/v1/seed-admin" \
            -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
            -H "Content-Type: application/json"
        echo ""
        
        # Step 6: Pull changes
        echo "Step 6/7: Pull database changes"
        supabase db pull
        echo ""
        
        # Step 7: Generate types
        echo "Step 7/7: Generate TypeScript types"
        supabase gen types typescript --project-id $PROJECT_ID > src/integrations/supabase/types.ts
        echo ""
        
        echo "✅ Full setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Update supabase/config.toml with your project ID"
        echo "2. Configure Edge Function secrets in Supabase dashboard"
        echo "3. Run: npm install && npm run dev"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "Done! 🎉"
