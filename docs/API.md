# XiW Bot Server API Documentation (v1.4.0)

## Overview
This API provides a unified interface for WhatsApp automation. It is divided into two distinct sections:
1.  **Public Messaging API**: For AI Agents and external integrations to send messages.
2.  **Management API**: For the Dashboard UI and Admin tools to manage instances, users, and config.

### Base URL
`http://localhost:3000` (Default)

### Authentication
*   **External Scripts / AI Agents**: Use **API Tokens**.
    *   Header: `Authorization: Bearer <your_long_lived_api_token>`
*   **Dashboard / Admins**: Use **JWT Tokens** (obtained via Login).
    *   Header: `Authorization: Bearer <jwt_token>`

---

## 1. Public Messaging API
**Prefix**: `/api/wa/send`

These endpoints are governed by the **Messaging Policy Engine (MPE)**. All requests are checked for:
*   **Quotas**: Daily message limits per user.
*   **Suppression**: Contact blocklists.
*   **Policy**: Content rules (e.g., forbidden words) and 24h Reply Windows (if enforced).

### Common Responses
*   `200 OK`: Message sent (or queued).
*   `400 Bad Request`: Missing fields or invalid format.
*   `403 Forbidden`: Blocked by MPE.
    *   `{ "error": "Message limit reached" }`
    *   `{ "error": "Contact is suppressed" }`
    *   `{ "error": "Outside 24h reply window" }`
*   `404 Not Found`: Instance not active or Session invalid.

### Endpoints

#### Send Text
**POST** `/api/wa/send/text/:instance_id`
```json
{
  "to": "1234567890",
  "message": "Hello World!"
}
```

#### Send Image
**POST** `/api/wa/send/image/:instance_id`
```json
{
  "to": "1234567890",
  "url": "https://example.com/image.png",
  "caption": "Check this out!"
}
```

#### Send Video
**POST** `/api/wa/send/video/:instance_id`
```json
{
  "to": "1234567890",
  "url": "https://example.com/video.mp4",
  "caption": "Demo Video",
  "gifPlayback": false // Optional: Play as GIF
}
```

#### Send Audio / PTT (Voice Note)
**POST** `/api/wa/send/audio/:instance_id`
```json
{
  "to": "1234567890",
  "url": "https://example.com/audio.mp3",
  "ptt": true // true = Voice Note (waveform), false = Audio File
}
```

#### Send Document
**POST** `/api/wa/send/document/:instance_id`
```json
{
  "to": "1234567890",
  "url": "https://example.com/file.pdf",
  "filename": "invoice_001.pdf",
  "mimetype": "application/pdf" // Optional
}
```

#### Send Location
**POST** `/api/wa/send/location/:instance_id`
```json
{
  "to": "1234567890",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "San Francisco, CA"
}
```

#### Send Template
**POST** `/api/wa/send/template/:instance_id`
*Advanced: Hydrates a server-side template with variables.*
```json
{
  "to": "1234567890",
  "templateName": "welcome_message",
  "variables": ["John Doe", "Premium"] // Replaces {{1}}, {{2}} in template
}
```

---

## 2. Management API (Backend)
**Prefix**: `/backend` (Mostly)
**Role Required**: `admin` or active dashboard session.

### Authentication & Identity
*   **POST** `/api/auth/login`: `{ "username": "...", "password": "..." }` -> Returns `{ token, role, expiresAt }`
*   **GET** `/api/wa/me`: Returns current user details and assigned instances.

### Instance Management
*   **GET** `/backend/wa/status`: List all instances, their connection status (`connected`, `stopped`, `authenticating`), and QR codes.
*   **GET** `/backend/wa/status/:id`: Status for a single instance.
*   **POST** `/backend/instances`: Create generic instance `{ "name": "Support Bot" }`.
*   **DELETE** `/backend/instances/:id`: Delete instance and data.
*   **POST** `/backend/wa/start/:id`: Start/Resume session.
*   **POST** `/backend/wa/logout/:id`: Logout and clear session.
*   **PATCH** `/backend/instances/:id`: Update config.
    *   Payload: `{ "reply_window_enforced": true/false }`

### Contact Management
*   **GET** `/backend/contacts`: List all contacts (CRM).
*   **POST** `/backend/contacts`: Create manual contact.
*   **PUT/DELETE** `/backend/contacts/:id`: Modify contacts.
*   **GET** `/backend/contacts/export`: Download CSV.
*   **POST** `/backend/contacts/import`: Bulk import CSV/TXT.

### User & Access Control (Admin Only)
*   **GET** `/backend/users`: List users.
*   **POST** `/backend/users`: Create user `{ "username": "...", "role": "agent/admin", "message_limit": 1000 }`.
*   **PUT/DELETE** `/backend/users/:id`: Edit/Remove user.
*   **POST** `/backend/users/:id/static-token`: Generate a long-lived API token for a user (UI Helper).

### Logs & Audit
*   **GET** `/backend/logs`: Fetch recent audit logs.
*   **GET** `/backend/logs/export`: Download Audit CSV (supports ?startDate, ?endDate, ?userid).
*   **GET** `/backend/logs/:instance_id/stream`: **Server-Sent Events (SSE)** stream for live terminal output from a specific bot instance.

### Security Tokens
*   **GET / POST / DELETE** `/backend/tokens`: Manage raw API tokens for external integrations (Machine-to-Machine).

---

## 3. System
*   **GET** `/api/health`: System capabilities, DB status, and supported endpoints.
*   **GET** `/api/version`: Current build version and timestamp.
