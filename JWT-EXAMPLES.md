# JWT Token Examples

## What is a JWT?

A JWT (JSON Web Token) is a compact, URL-safe token consisting of three parts separated by dots:

```
header.payload.signature
```

## Structure

### 1. Header
Contains the token type and signing algorithm:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2. Payload (Claims)
Contains the user data and metadata:
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "role": "owner",
  "iat": 1704067200,  // issued at (timestamp)
  "exp": 1704672000   // expires at (timestamp)
}
```

### 3. Signature
Cryptographic signature to verify the token hasn't been tampered with.

## Example Token

Here's what a real JWT looks like:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

This is actually three base64url-encoded parts:

**Part 1** (Header):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```
Decodes to:
```json
{"alg":"HS256","typ":"JWT"}
```

**Part 2** (Payload):
```
eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoib3duZXIiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDY3MjAwMH0
```
Decodes to:
```json
{"userId":"123e4567-e89b-12d3-a456-426614174000","email":"user@example.com","role":"owner","iat":1704067200,"exp":1704672000}
```

**Part 3** (Signature):
```
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Your Backend JWT Format

When a user signs up or logs in, your backend returns:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "owner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  // The JWT
  }
}
```

The token contains:
- `userId`: User's UUID from the database
- `email`: User's email
- `role`: Either "owner" or "housekeeper"
- `iat`: Timestamp when token was issued
- `exp`: Timestamp when token expires (7 days from issue)

## How to Use the Token

### 1. Client-side (Frontend)
Store the token after login:
```javascript
// After login API call
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();
const token = data.data.token;

// Store in localStorage
localStorage.setItem('authToken', token);
```

### 2. Send Token in Requests
Include the token in Authorization header:
```javascript
fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### 3. Server-side (Backend)
Verify the token to authorize requests:
```javascript
const { verifyToken } = require('./utils/jwt');

// Middleware example
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = verifyToken(token);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};
```

## Decode a JWT (Read Only)

You can decode a JWT to see its contents WITHOUT verifying the signature:

**Online:**
- Go to https://jwt.io
- Paste your token
- See the decoded header and payload

**In Node.js:**
```javascript
const jwt = require('jsonwebtoken');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

// Decode WITHOUT verification (just read the payload)
const decoded = jwt.decode(token);
console.log(decoded);
// { userId, email, role, iat, exp }
```

**⚠️ Important:** `jwt.decode()` doesn't verify the signature. Use `jwt.verify()` when you need to ensure the token is valid and not tampered with.

## Security Notes

1. **Never store sensitive data** (like passwords) in JWT payload
2. **Keep JWT_SECRET secure** - never commit to Git
3. **Token expires after 7 days** - user must login again
4. **Verify tokens on every protected route**
5. **Use HTTPS in production** - tokens can be intercepted over HTTP

## Token Lifetime

Your tokens expire after **7 days** (as configured in `utils/jwt.js`):

```javascript
expiresIn: '7d' // Token expires in 7 days
```

After expiration, users will get a 401 Unauthorized error and must login again.

## Testing JWT in Your Backend

After running the login endpoint in Postman:
1. Copy the `token` from the response
2. Go to https://jwt.io
3. Paste the token in the "Encoded" section
4. You'll see the decoded payload with userId, email, role, etc.

