# Supabase Setup Guide

This guide will walk you through setting up Supabase for your cleaning platform backend.

## Step 1: Create a Supabase Account and Project

1. Go to https://supabase.com
2. Sign up for a free account (or log in if you already have one)
3. Click "New Project"
4. Fill in:
   - **Name**: Cleaning Platform (or any name you prefer)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project"
6. Wait 2-3 minutes for the project to be provisioned

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click **Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. You'll see several important values:

### Project URL
- Location: At the top of the API settings page
- Format: `https://xxxxxxxxxxxxxxxxx.supabase.co`
- This is your `SUPABASE_URL`

### Project API Keys
You'll see multiple keys. For backend use:

#### service_role key (⚠️ SECRET)
- Location: Under "Project API keys" → "service_role"
- This key **bypasses Row Level Security (RLS)** - only use in backend!
- This is your `SUPABASE_SERVICE_ROLE_KEY`

#### anon key (for public/frontend use)
- Keep this for later if you plan to use Supabase client in your frontend

## Step 3: Configure Your Backend

### Create .env File

In your `backend` folder, create a file named `.env`:

**Windows:**
```bash
cd backend
type nul > .env
```

**Mac/Linux:**
```bash
cd backend
touch .env
```

Then open `.env` and add:

```env
PORT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=generate_a_strong_random_string_here
```

**Replace the values:**
- `SUPABASE_URL`: Paste your Project URL from Step 2
- `SUPABASE_SERVICE_ROLE_KEY`: Paste your service_role key from Step 2
- `JWT_SECRET`: Generate a strong random string (see below)

### Generate JWT Secret

**Option 1: Using OpenSSL**
```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**
Go to https://generate-secret.vercel.app/32 and copy the result

## Step 4: Create Database Tables

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the entire contents of `config/database.sql`
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
5. You should see "Success. No rows returned"

### Verify Tables Were Created

1. In the sidebar, click **Table Editor**
2. You should see two tables:
   - `users`
   - `profiles`

Click on each table to verify they were created correctly.

### Verify Indexes

1. In the sidebar, click **Database** → **Indexes**
2. You should see:
   - `idx_profiles_user_id`
   - `idx_users_email`

## Step 5: Test the Connection

1. Make sure you have your `.env` file set up correctly
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies (if not already done):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. You should see:
   ```
   🚀 Server is running on port 5000
   📍 API endpoints available at http://localhost:5000/api
   🏥 Health check: http://localhost:5000
   ```

## Step 6: Test the API

### Option A: Using Browser/REST Client

Open your browser or REST client and test:

1. Health Check:
   ```
   GET http://localhost:5000/
   ```

2. Signup:
   ```
   POST http://localhost:5000/api/auth/signup
   Content-Type: application/json
   
   {
     "email": "test@example.com",
     "password": "password123",
     "name": "Test User",
     "role": "owner"
   }
   ```

### Option B: Using Postman

1. Import `test-api.http` into Postman (or use VS Code REST Client extension)
2. Follow the examples in the file

### Option C: Using cURL

```bash
# Health check
curl http://localhost:5000/

# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "owner"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file exists in the `backend` folder
- Check that variable names are exactly: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify no extra spaces or quotes around the values

### "Failed to fetch" or connection errors
- Verify your `SUPABASE_URL` is correct (should start with `https://`)
- Check that your Supabase project is active (not paused)
- Verify internet connection

### "JWT_SECRET is required"
- Make sure `JWT_SECRET` is set in your `.env` file
- It should be a strong random string (not empty)

### "relation 'users' does not exist"
- You need to run the SQL queries from `config/database.sql`
- Go to Supabase → SQL Editor → New Query → Paste SQL → Run

### Tables show as empty in Table Editor
- This is normal! Tables exist but have no data yet
- Run a signup request via API to create test data

### "duplicate key value violates unique constraint"
- You're trying to signup with an email that already exists
- Use a different email or delete the existing user from Supabase Table Editor

## Next Steps

Once your backend is working:

1. ✅ Store the JWT token from login responses
2. ✅ Add authentication middleware to protect routes
3. ✅ Create additional API endpoints as needed
4. ✅ Connect your frontend to these auth endpoints

## Security Reminders

- ⚠️ Never commit your `.env` file to Git
- ⚠️ The `service_role` key has admin access - only use in backend
- ⚠️ Keep your `JWT_SECRET` secure and random
- ⚠️ Use HTTPS in production
- ✅ Passwords are automatically hashed with bcrypt
- ✅ Email is stored in lowercase for consistency

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check the logs for detailed error messages

