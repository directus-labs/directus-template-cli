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

Extract a template from a Directus instance.

**Request Body:**
```json
{
  "directusUrl": "http://localhost:8055",
  "directusToken": "your-admin-token",
  "templateLocation": "./my-extracted-template",
  "templateName": "My Template"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `directusUrl` | string | Yes | URL of the Directus instance |
| `directusToken` | string | No* | Admin token for authentication |
| `userEmail` | string | No* | Email for authentication |
| `userPassword` | string | No* | Password for authentication |
| `templateLocation` | string | Yes | Directory to extract the template to |
| `templateName` | string | Yes | Name of the template |

*Either `directusToken` or both `userEmail` and `userPassword` are required.

**Example with curl:**
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

**Success Response:**
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
