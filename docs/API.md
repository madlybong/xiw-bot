# XiW Bot Server API Documentation

## Authentication
Most endpoints require authentication. You can authenticate in two ways:
1.  **JWT Bearer Token** (For Dashboard/Admin): Obtained via `/api/auth/login`.
    - Header: `Authorization: Bearer <token>`
2.  **API Token** (For External Scripts): Generated in the Dashboard -> Token Manager.
    - Header: `Authorization: Bearer <your_api_token>`

## Base URL
`http://localhost:3000`

---

## 1. Authentication

### Login (Admin/Dashboard)
**POST** `/api/auth/login`

**Payload:**
```json
{
  "username": "admin",
  "password": "admin" // Or your set password
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "role": "admin",
  "expiresAt": 1709...
}
```

### Version Check (Public)
**GET** `/api/version`

**Response:**
```json
{
  "version": "1.3.5",
  "build_time": "..."
}
```

---

## 2. WhatsApp Management (Backend API)

### Create Account (Instance)
**POST** `/backend/accounts`

**Payload:**
```json
{
  "name": "My Support Bot",
  "config": "{}" 
}
```

### Get Account/Instance Status
**GET** `/backend/wa/status`
Returns list of all instances with status.

**GET** `/backend/wa/status/:id`
Returns status for specific instance.

**Response:**
```json
{
  "status": "connected", // or "stopped", "connecting"
  "qr": null, // or QR string if connecting
  "user": { ... } // if connected
}
```

### Start Session
**POST** `/backend/wa/start/:id`
Example: `/backend/wa/start/1`

### Logout / Delete Session
**POST** `/backend/wa/logout/:id`
Disconnects and clears session data.

---

## 3. Messaging (Public API)

### Send Text
**POST** `/api/wa/send/text/:id`

**Payload:**
```json
{
  "to": "1234567890",
  "message": "Hello!"
}
```

### Send Image
**POST** `/api/wa/send/image/:id`

**Payload:**
```json
{
  "to": "1234567890",
  "url": "https://...",
  "caption": "Look!"
}
```

### Send Video
**POST** `/api/wa/send/video/:id`

**Payload:**
```json
{
  "to": "1234567890",
  "url": "https://...",
  "caption": "Watch!",
  "gifPlayback": false
}
```

### Send Document
**POST** `/api/wa/send/document/:id`

**Payload:**
```json
{
  "to": "1234567890",
  "url": "https://...",
  "filename": "file.pdf"
}
```

### Send Location
**POST** `/api/wa/send/location/:id`

**Payload:**
```json
{
  "to": "1234567890",
  "latitude": 24.123,
  "longitude": 55.123,
  "address": "My Location"
}
```

---

## 4. API Token Management (Backend API)

### List Tokens
**GET** `/backend/tokens`

### Generate Token
**POST** `/backend/tokens`

**Payload:**
```json
{
  "name": "Zapier Integration",
  "userId": 1,
  "instanceIds": [1, 2]
}
```

### Revoke Token
**DELETE** `/backend/tokens/:id`

---

## 5. Me / Identity
**GET** `/api/wa/me`
Returns current authenticated user details and assigned instances.
