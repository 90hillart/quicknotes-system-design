
# QuickNotes REST API Design

## Overview

This document describes the production API to be built by the QuickNotes backend team. It is separate from the JSONPlaceholder practice API used by the browser client.

Base URL: `https://api.quicknotes.example/v1`

All request and response bodies use JSON. Protected endpoints require a valid bearer access token over HTTPS.

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | /notes | List the authenticated user's notes | 200 OK |
| GET | /notes/{id} | Retrieve one note | 200 OK |
| POST | /notes | Create a note | 201 Created |
| PUT | /notes/{id} | Replace a note | 200 OK |
| PATCH | /notes/{id} | Partially update a note | 200 OK |
| DELETE | /notes/{id} | Delete a note | 204 No Content |
| GET | /tags | List the user's tags | 200 OK |
| POST | /tags | Create a tag | 201 Created |
| GET | /notes/{id}/tags | List tags assigned to a note | 200 OK |

## Create a Note

`POST /v1/notes`

Request headers:

http
Content-Type: application/json
Authorization: Bearer <access-token>


Request body:


{
  "title": "Revision plan",
  "body": "Review database normalization.",
  "tagIds": [2, 4]
}


The title is required and must not exceed 100 characters. The body is optional.

Success response: `201 Created`


{
  "id": 101,
  "userId": 7,
  "title": "Revision plan",
  "body": "Review database normalization.",
  "createdAt": "2026-10-16T10:00:00Z",
  "updatedAt": "2026-10-16T10:00:00Z",
  "tags": [2, 4]
}


## List Notes

`GET /v1/notes?limit=10&offset=0`

Success response: `200 OK`


{
  "data": [
    {
      "id": 101,
      "userId": 7,
      "title": "Revision plan",
      "body": "Review database normalization.",
      "createdAt": "2026-10-16T10:00:00Z",
      "updatedAt": "2026-10-16T10:00:00Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}


If there are no notes, return `200 OK` with an empty `data` array.

## Update a Note

`PATCH /v1/notes/101`

Request:

{
  "title": "Updated revision plan"
}
```

Success status: `200 OK`, returning the updated note.

## Delete a Note

`DELETE /v1/notes/101`

Success status: `204 No Content`, with no response body.

## Error Status Codes

| Status | Meaning |
|---|---|
| 400 | Invalid request or validation failure |
| 401 | Missing or invalid authentication |
| 403 | Authenticated user lacks permission |
| 404 | Resource not found |
| 409 | Conflict, such as a duplicate tag |
| 422 | Valid syntax but invalid business data |
| 429 | Too many requests |
| 500 | Unexpected server error |

Example error body:


{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The note title is required.",
    "details": {
      "field": "title"
    }
  }
}
```

## Design Principles

- Use resource names and standard HTTP methods.
- Authenticate and authorize every private note operation.
- Validate input on the server, even if the client also validates it.
- Apply pagination to list endpoints.
- Return consistent error objects.
- Use HTTPS and avoid exposing secrets in error messages.
