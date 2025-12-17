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
  "password": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1Ni..."
}
```

---

## 2. WhatsApp Management

### Create Account (Instance)
**POST** `/api/accounts`

**Payload:**
```json
{
  "name": "My Support Bot",
  "config": "{}" 
}
```

### Get Account ID
**GET** `/api/accounts`
Returns list of accounts. note the `id` of the account you want to control.

### Start Session
**POST** `/api/wa/start/:id`
Example: `/api/wa/start/1`

### Get Status / QR Code
**GET** `/api/wa/status/:id`

**Response (Connecting):**
```json
{
  "status": "connecting",
  "qr": "2@...==" 
}
```
*Render this QR code string (it's the raw data) using a QR library.*

**Response (Connected):**
```json
{
  "status": "connected",
  "qr": null
}
```

### Logout / Delete Session
**POST** `/api/wa/logout/:id`
Disconnects and clears session data.

---

---

## 3. Messaging

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
  "caption": "Watch!"
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

---

## 4. API Token Management

### List Tokens
**GET** `/api/tokens`

### Generate Token
**POST** `/api/tokens`

**Payload:**
```json
{
  "name": "Zapier Integration"
}
```

**Response:**
```json
{
  "token": "xiw_..."
}
```

### Revoke Token
**DELETE** `/api/tokens/:id`
