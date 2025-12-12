# Directus Template CLI - API Server

This document describes how to use the Directus Template CLI as an API-driven service using Express.js.

## Overview

The Directus Template CLI now supports both CLI and API modes:
- **CLI Mode**: Traditional command-line interface (original functionality)
- **API Mode**: REST API server for programmatic access

Both modes use the same underlying business logic, ensuring consistent behavior.

## Starting the API Server

### Using npm scripts:

```bash
npm start
# or
npm run api
```

### Using the binary directly:

```bash
node ./bin/api-server.js
```

### Custom port:

```bash
PORT=8080 npm start
```

The server will start on port 3000 by default (or the port specified by the `PORT` environment variable).

## Rate Limiting

The API implements rate limiting to protect against abuse:
- **Limit**: 10 requests per minute per IP address
- **Applies to**: `/api/apply` and `/api/extract` endpoints
- **Response**: Returns HTTP 429 with error message when limit is exceeded

**Rate limit response:**
```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```

Rate limit information is returned in response headers:
- `RateLimit-Limit`: Maximum number of requests allowed
- `RateLimit-Remaining`: Number of requests remaining in current window
- `RateLimit-Reset`: Time when the rate limit window resets

## Authentication

The API supports optional token-based authentication to protect the `/api/apply` and `/api/extract` endpoints.

### Enabling Authentication

Set the `API_AUTH_TOKEN` environment variable to enable authentication:

```bash
API_AUTH_TOKEN=your-secret-token npm start
```

When enabled:
- All requests to `/api/apply` and `/api/extract` require a valid token
- The `/health` and `/` endpoints remain public
- The root endpoint (`/`) will show `"authEnabled": true`

### Providing the Token

You can provide the authentication token in three ways:

**1. Bearer Token (recommended):**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"directusUrl": "...", ...}'
```

**2. Direct Authorization Header:**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Authorization: your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"directusUrl": "...", ...}'
```

**3. X-API-Key Header:**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "X-API-Key: your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"directusUrl": "...", ...}'
```

### Authentication Errors

**Missing token (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication token is required. Provide it via Authorization header or X-API-Key header."
}
```

**Invalid token (403 Forbidden):**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Invalid authentication token."
}
```

## API Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

Check if the API server is running.

**Example:**
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "0.7.4",
  "timestamp": "2025-12-04T23:09:34.513Z"
}
```

### 2. API Information

**Endpoint:** `GET /`

Get information about available endpoints.

**Example:**
```bash
curl http://localhost:3000/
```

**Response:**
```json
{
  "message": "Directus Template CLI API",
  "version": "0.7.4",
  "authEnabled": false,
  "endpoints": {
    "health": "GET /health",
    "apply": "POST /api/apply",
    "extract": "POST /api/extract"
  }
}
```

### 3. Apply Template

**Endpoint:** `POST /api/apply`

Apply a template to a Directus instance.

**Request Body:**
```json
{
  "directusUrl": "http://localhost:8055",
  "directusToken": "your-admin-token",
  "templateLocation": "./my-template",
  "templateType": "local",
  "partial": false,
  "content": true,
  "dashboards": true,
  "extensions": true,
  "files": true,
  "flows": true,
  "permissions": true,
  "schema": true,
  "settings": true,
  "users": true
}
```

**Authentication Options:**

Option 1: Using token
```json
{
  "directusUrl": "http://localhost:8055",
  "directusToken": "your-admin-token",
  "templateLocation": "./my-template"
}
```

Option 2: Using email/password
```json
{
  "directusUrl": "http://localhost:8055",
  "userEmail": "admin@example.com",
  "userPassword": "admin",
  "templateLocation": "./my-template"
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `directusUrl` | string | Yes | - | URL of the Directus instance |
| `directusToken` | string | No* | - | Admin token for authentication |
| `userEmail` | string | No* | - | Email for authentication |
| `userPassword` | string | No* | - | Password for authentication |
| `templateLocation` | string | Yes | - | Location of the template |
| `templateType` | string | No | "local" | Type of template: "local", "community", or "github" |
| `partial` | boolean | No | false | Enable partial template application |
| `content` | boolean | No | true | Load Content (data) |
| `dashboards` | boolean | No | true | Load Dashboards |
| `extensions` | boolean | No | true | Load Extensions |
| `files` | boolean | No | true | Load Files |
| `flows` | boolean | No | true | Load Flows |
| `permissions` | boolean | No | true | Load Permissions |
| `schema` | boolean | No | true | Load Schema |
| `settings` | boolean | No | true | Load Settings |
| `users` | boolean | No | true | Load Users |

*Either `directusToken` or both `userEmail` and `userPassword` are required.

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "your-admin-token",
    "templateLocation": "./my-template",
    "templateType": "local"
  }'
```

**Example with partial application:**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "your-admin-token",
    "templateLocation": "./my-template",
    "templateType": "local",
    "partial": true,
    "schema": true,
    "permissions": true,
    "content": false,
    "users": false
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Template applied successfully",
  "data": {
    "templateLocation": "./my-template",
    "templateType": "local"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "directusUrl is required"
}
```

### 4. Extract Template

**Endpoint:** `POST /api/extract`

Extract a template from a Directus instance. Supports two modes:
1. **Save to disk**: Extract and save the template to a local directory
2. **Return archive**: Extract and return a gzipped tar archive

**Request Body (Save to disk):**
```json
{
  "directusUrl": "http://localhost:8055",
  "directusToken": "your-admin-token",
  "templateLocation": "./my-extracted-template",
  "templateName": "My Template"
}
```

**Request Body (Return archive):**
```json
{
  "directusUrl": "http://localhost:8055",
  "directusToken": "your-admin-token",
  "templateName": "My Template",
  "returnArchive": true,
  "archiveFormat": "binary"
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `directusUrl` | string | Yes | - | URL of the Directus instance |
| `directusToken` | string | No* | - | Admin token for authentication |
| `userEmail` | string | No* | - | Email for authentication |
| `userPassword` | string | No* | - | Password for authentication |
| `templateName` | string | Yes | - | Name of the template |
| `templateLocation` | string | No** | - | Directory to extract the template to |
| `returnArchive` | boolean | No | false | If true, returns a gzipped tar archive instead of saving to disk |
| `archiveFormat` | string | No | "binary" | Format for archive response: "binary" (file download) or "base64" (JSON with base64 data) |

*Either `directusToken` or both `userEmail` and `userPassword` are required.
**Required when `returnArchive` is not set or is false.

**Example - Save to disk:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "your-admin-token",
    "templateLocation": "./my-extracted-template",
    "templateName": "My Template"
  }'
```

**Example - Download archive:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -o my-template.tar.gz \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "your-admin-token",
    "templateName": "my-template",
    "returnArchive": true
  }'
```

**Example - Get base64 archive:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Content-Type: application/json" \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "your-admin-token",
    "templateName": "my-template",
    "returnArchive": true,
    "archiveFormat": "base64"
  }'
```

**Success Response (Save to disk):**
```json
{
  "success": true,
  "message": "Template extracted successfully",
  "data": {
    "templateName": "My Template",
    "templateLocation": "./my-extracted-template"
  }
}
```

**Success Response (base64 archive):**
```json
{
  "success": true,
  "message": "Template extracted successfully",
  "data": {
    "templateName": "my-template",
    "filename": "my-template.tar.gz",
    "contentType": "application/gzip",
    "size": 12345,
    "archive": "H4sIAAAAAAAAA+3OMQ..."
  }
}
```

**Success Response (binary archive):**
Returns the raw gzipped tar file with headers:
- `Content-Type: application/gzip`
- `Content-Disposition: attachment; filename="my-template.tar.gz"`

**Error Response:**
```json
{
  "success": false,
  "error": "templateName is required"
}
```

## Integration Examples

### Node.js / JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/apply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    directusUrl: 'http://localhost:8055',
    directusToken: 'your-admin-token',
    templateLocation: './my-template',
    templateType: 'local'
  })
});

const result = await response.json();
console.log(result);
```

### Python

```python
import requests

response = requests.post('http://localhost:3000/api/apply', json={
    'directusUrl': 'http://localhost:8055',
    'directusToken': 'your-admin-token',
    'templateLocation': './my-template',
    'templateType': 'local'
})

print(response.json())
```

### Using with Docker

You can containerize the API server for easy deployment:

**Dockerfile example:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["node", "./bin/api-server.js"]
```

**Build and run:**
```bash
docker build -t directus-template-api .
docker run -p 3000:3000 directus-template-api
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `DIRECTUS_URL`: Default Directus URL for requests
- `DIRECTUS_TOKEN`: Default Directus token

## Logging

All API requests are logged to `.directus-template-cli/logs/run-[timestamp].log` in the current working directory.

Sensitive information (passwords, tokens, keys) is automatically sanitized in the logs.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `400`: Bad request (validation error)
- `404`: Not found (e.g., template not found)
- `500`: Internal server error

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Comparison: CLI vs API

Both modes provide the same functionality but through different interfaces:

| Feature | CLI | API |
|---------|-----|-----|
| Apply templates | ✅ `apply` command | ✅ `POST /api/apply` |
| Extract templates | ✅ `extract` command | ✅ `POST /api/extract` |
| Interactive mode | ✅ Yes | ❌ No |
| Programmatic mode | ✅ Yes | ✅ Yes (all requests) |
| Init new projects | ✅ `init` command | ❌ Not yet implemented |

## Limitations

- The `init` command is not yet available via the API (only through CLI)
- API mode does not support interactive prompts
- All API operations run in programmatic mode

## Development

To contribute or modify the API server:

1. API server code is located in `src/api/`
2. Business logic is shared with CLI in `src/lib/`
3. Run `pnpm build` after making changes
4. Test with `pnpm start`

## Migration from CLI

If you're currently using the CLI in programmatic mode, you can easily migrate to the API:

**Before (CLI):**
```bash
npx directus-template-cli apply -p \
  --directusUrl="http://localhost:8055" \
  --directusToken="admin-token" \
  --templateLocation="./my-template" \
  --templateType="local"
```

**After (API):**
```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "directusUrl": "http://localhost:8055",
    "directusToken": "admin-token",
    "templateLocation": "./my-template",
    "templateType": "local"
  }'
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/directus-labs/directus-template-cli/issues
- Original CLI documentation: See [README.md](./README.md)
