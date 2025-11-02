-- Supabase Database Schema for Cleaning Platform
-- Run these queries in your Supabase SQL Editor
-- URL: https://supabase.com/dashboard → Your Project → SQL Editor

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

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create messages table for chat system
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    deleted_for_sender BOOLEAN DEFAULT FALSE,
    deleted_for_receiver BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes on messages for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user authentication information';
COMMENT ON TABLE profiles IS 'Stores user profile and role information';
COMMENT ON TABLE messages IS 'Stores chat messages between users';

