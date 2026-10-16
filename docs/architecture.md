
# QuickNotes System Architecture

## 1. Overview

QuickNotes is an online note-taking service for creating, viewing, updating, deleting and tagging personal notes.

## 2. Functional Requirements

1. Users can register and authenticate.
2. Users can create, list, retrieve, update and delete notes.
3. Users can create tags and assign them to notes.
4. Users can search, sort and paginate their notes.
5. Users can access only resources they are authorized to use.
6. The API validates input and returns meaningful errors.

## 3. Non-Functional Requirements

- Availability: tolerate individual application-server failures.
- Performance: deliver common note reads quickly under normal load.
- Scalability: scale application servers horizontally.
- Security: use HTTPS, authentication, authorization and input validation.
- Durability: preserve successfully committed notes across application failures.
- Consistency: use the primary database for writes and critical read-after-write requests.
- Observability: monitor errors, latency, resource utilization and queue backlogs.

## 4. Load Estimates for One Million Users

### Assumptions

- Registered users: 1,000,000.
- Daily active users: 20%, or 200,000.
- Each active user reads/lists notes 30 times daily.
- Each active user creates 2 notes daily.
- Each active user updates 1 note daily.
- Each active user deletes an average of 0.2 notes daily.
- Each new note uses approximately 2 KB for content and metadata.
- A year has 365 days and 86,400 seconds per day.
- Peak traffic is estimated at 5 times average traffic.
- Estimates exclude authentication traffic, retries, database replication, indexes, backups and background jobs.

### Daily Active Users

DAU = 1,000,000 × 0.20 = 200,000 users.

### Reads per Second

Daily reads = 200,000 × 30 = 6,000,000.

Average reads per second = 6,000,000 / 86,400.

**Average reads = approximately 69.44 requests/second.**

Peak reads = 69.44 × 5.

**Peak reads = approximately 347.22 requests/second.**

### Writes per Second

Daily creates = 200,000 × 2 = 400,000.

Daily updates = 200,000 × 1 = 200,000.

Daily deletes = 200,000 × 0.2 = 40,000.

Total daily writes = 640,000.

Average writes per second = 640,000 / 86,400.

**Average writes = approximately 7.41 requests/second.**

Peak writes = 7.41 × 5.

**Peak writes = approximately 37.04 requests/second.**

These numbers represent API-level mutations, not every internal database operation.

### Storage per Year

Annual new notes = 400,000 × 365 = 146,000,000 notes.

At 2 KB per note:

146,000,000 × 2 KB = 292,000,000 KB.

**Annual new note storage = approximately 292 GB** using decimal units, before indexes, backups, replicas and overhead.

This estimates newly created note data, not total accumulated storage. Actual storage depends on existing notes, retention and deletion.

### Read-Heavy or Write-Heavy?

QuickNotes is read-heavy under these assumptions: approximately 69.44 reads per second compared with 7.41 writes per second on average. Caching and read replicas can reduce read pressure while the primary database handles reliable writes.

## 5. Architecture Diagram

```text
                    +----------------------+
                    | Client: Web / Mobile |
                    +----------+-----------+
                               |
                         +-----v-----+
                         |    DNS    |
                         +-----+-----+
                               |
                         +-----v-----+
                         |    CDN    |
                         | Static UI |
                         +-----+-----+
                               |
                       +-------v--------+
                       | Load Balancer  |
                       +-------+--------+
                               |
                 +-------------+-------------+
                 |             |             |
           +-----v----+  +-----v----+  +-----v----+
           | App 1    |  | App 2    |  | App N    |
           +-----+----+  +-----+----+  +-----+----+
                 |             |             |
                 +-------------+-------------+
                               |
                    +----------+----------+
                    |                     |
              +-----v------+       +------v-------+
              | Cache      |       | Primary DB   |
              | Redis      |       | Read / Write |
              +------------+       +------+-------+
                                          |
                                   +------v-------+
                                   | Read Replica |
                                   +--------------+

           App servers publish asynchronous jobs
                               |
                         +-----v-----+
                         |   Queue   |
                         +-----+-----+
                               |
                         +-----v-----+
                         |   Worker  |
                         +-----------+
```

The queue and worker handle asynchronous work such as notifications, exports or cleanup. A note creation must be committed to the primary database before the API confirms success.

## 6. Component Responsibilities

1. Client: provides the interface through which users manage their notes.
2. DNS: resolves the application hostname to the service endpoint.
3. CDN: serves cached static assets close to users, reducing latency and origin traffic.
4. Load balancer: distributes requests across healthy application servers.
5. App servers: validate requests, enforce authorization and implement business logic.
6. Cache: stores frequently accessed note data to reduce database load and latency.
7. Primary database: stores authoritative records and processes transactional writes.
8. Read replica: handles eligible read queries and reduces pressure on the primary database.
9. Queue: buffers background tasks so slow processing does not block API requests.
10. Worker: processes queued jobs and retries recoverable failures independently.

## 7. GET /notes Flow

1. The client sends `GET /v1/notes` over HTTPS.
2. DNS resolves the service hostname.
3. The load balancer routes the request to a healthy application server.
4. The server authenticates the user and verifies access rights.
5. The server checks the cache for the user's note-list data.
6. If the cache misses, the server queries the read replica when appropriate.
7. The server applies ownership filters, pagination and sorting.
8. The server returns JSON containing the notes and pagination metadata.
9. The cache is populated or refreshed when appropriate.

For critical read-after-write operations, bypass stale cache entries and read from the primary database.

## 8. POST /notes Flow

1. The client sends `POST /v1/notes` with JSON data and authentication credentials.
2. DNS and the load balancer route the request to an application server.
3. The server authenticates the user and validates the title, body and tags.
4. The server writes the note to the primary database within a transaction.
5. The database commits the note.
6. Any required background job is published to the queue. A transactional outbox can ensure that job publication is not lost after a successful database commit.
7. Affected cache entries are invalidated or updated.
8. The server returns `201 Created` with the new note.

If the database write fails, the server must return an error rather than claim success.

## 9. Trade-Offs

### Caching versus freshness

Caching improves speed and reduces database load, but cached data can become stale. Use expiration, invalidation and cache bypass rules for critical reads.

### Read replicas versus consistency

Read replicas improve read capacity, but replication lag can hide recent updates. Route critical read-after-write requests to the primary database.

### Horizontal scaling versus cost

Additional app servers increase capacity and resilience but cost more to run. Autoscaling, monitoring and load testing help balance capacity and expense.

### Asynchronous processing versus completion delay

Queues prevent background jobs from slowing API requests, but jobs may be delayed or fail. Use retries, idempotent workers, dead-letter queues and monitoring.

## 10. Avoiding Single Points of Failure

- Run at least two application servers across separate failure domains.
- Use a highly available load-balancing service.
- Configure database backups, health monitoring, automated failover and recovery testing.
- Use a highly available cache or allow graceful operation when cache service is unavailable.
- Use a durable replicated queue with retry and dead-letter handling.
- Use reliable redundant DNS and CDN services.
- Monitor availability, replication lag, latency and resource utilization.

A read replica by itself does not remove the primary database as a single point of failure. Automated failover or a managed high-availability database configuration is also needed.

## 11. Conclusion

Under the stated assumptions, QuickNotes serves approximately 69.44 reads per second and 7.41 writes per second on average, with peak estimates of 347.22 reads and 37.04 writes per second. Newly created notes add approximately 292 GB of data per year before overhead. The design uses caching, horizontal application scaling, a primary database with a read replica, and a durable asynchronous job system to improve performance and resilience.
