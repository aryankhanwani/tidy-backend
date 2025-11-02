# Cleaning Platform Backend

Backend API for the Cleaning Platform built with Express.js and Supabase (PostgreSQL).

## Setup Instructions

### 1. Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (for `SUPABASE_URL`)
   - **service_role** key (for `SUPABASE_SERVICE_ROLE_KEY`)

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory with the following content:

```env
PORT=5000

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
```

**Important**: Use a strong random string for `JWT_SECRET` (e.g., generate with: `openssl rand -base64 32`)

### 3. Create Database Tables

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run the SQL queries from `config/database.sql`:

```sql
-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'housekeeper')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "owner"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "owner",
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

## Testing with Postman

### Signup Request
1. Create a new POST request to `http://localhost:5000/api/auth/signup`
2. Set Content-Type header: `application/json`
3. Add body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "role": "owner"
}
```
4. Send request

### Login Request
1. Create a new POST request to `http://localhost:5000/api/auth/login`
2. Set Content-Type header: `application/json`
3. Add body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
4. Send request

### Health Check
1. Create a new GET request to `http://localhost:5000/`
2. Should return: `{"success":true,"message":"Cleaning Platform Backend API is running"}`

## Project Structure

```
backend/
├── config/
│   ├── supabase.js          # Supabase client configuration
│   └── database.sql         # Database schema
├── controllers/
│   └── authController.js    # Authentication logic
├── routes/
│   └── authRoutes.js        # Authentication routes
├── utils/
│   ├── bcrypt.js           # Password hashing utilities
│   ├── jwt.js              # JWT token utilities
│   └── validate.js         # Input validation utilities
├── .env                    # Environment variables (create this)
├── .env.example           # Environment variables template
├── server.js              # Express server setup
├── package.json           # Dependencies
└── README.md             # This file
```

## Security Features

- Password hashing using bcrypt (10 salt rounds)
- JWT authentication tokens (7-day expiration)
- Input validation for email, password, and role
- SQL injection protection via Supabase client
- CORS enabled for cross-origin requests
- Environment variable protection for secrets

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error information (optional)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

