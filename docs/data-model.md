
# QuickNotes Data Model

## 1. Database Decision

QuickNotes will use MySQL 8, a relational SQL database. Users, notes and tags have structured relationships, and foreign keys, transactions and constraints help preserve data integrity.

## 2. Entities and Columns

### users

| Column | Type | Constraint |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

### notes

| Column | Type | Constraint |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Foreign key to users.id |
| title | VARCHAR(100) | NOT NULL |
| body | TEXT | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### tags

| Column | Type | Constraint |
|---|---|---|
| id | BIGINT | Primary key, auto-increment |
| user_id | BIGINT | Foreign key to users.id |
| name | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

The unique key `(user_id, name)` prevents a user from creating the same tag name twice.

### note_tags

| Column | Type | Constraint |
|---|---|---|
| note_id | BIGINT | Composite primary key; foreign key to notes.id |
| tag_id | BIGINT | Composite primary key; foreign key to tags.id |

The composite primary key `(note_id, tag_id)` prevents duplicate tag assignments.

## 3. Relationships

- Users to notes: one-to-many; a user can own many notes, and each note belongs to one user.
- Users to tags: one-to-many; a user can own many tags, and each tag belongs to one user.
- Notes to tags: many-to-many; a note can have many tags and a tag can be assigned to many notes.
- `note_tags` implements the many-to-many relationship.

## 4. CREATE TABLE Statements

```sql
CREATE DATABASE IF NOT EXISTS quicknotes_db;
USE quicknotes_db;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notes_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_tag_per_user UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    CONSTRAINT fk_note_tags_note
        FOREIGN KEY (note_id) REFERENCES notes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_note_tags_tag
        FOREIGN KEY (tag_id) REFERENCES tags(id)
        ON DELETE CASCADE
);
```

## 5. Example Queries

### Query 1: List a user's notes

```sql
SELECT id, title, body, created_at
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Query 2: Retrieve notes and tags using JOIN

```sql
SELECT n.id, n.title, t.name AS tag_name
FROM notes AS n
JOIN note_tags AS nt ON nt.note_id = n.id
JOIN tags AS t ON t.id = nt.tag_id
WHERE n.user_id = 1;
```

### Query 3: Count notes for each user

```sql
SELECT u.id, u.name, COUNT(n.id) AS note_count
FROM users AS u
LEFT JOIN notes AS n ON n.user_id = u.id
GROUP BY u.id, u.name;
```

### Query 4: Find notes without tags

```sql
SELECT n.id, n.title
FROM notes AS n
LEFT JOIN note_tags AS nt ON nt.note_id = n.id
WHERE nt.note_id IS NULL;
```

## 6. Indexes

```sql
CREATE INDEX idx_notes_user_created
ON notes(user_id, created_at);
```

This index supports queries that filter by user and sort notes by creation time, reducing the amount of data that may need to be scanned and sorted.

The unique index on `users.email` also supports efficient email lookups during authentication.

## 7. SQL versus NoSQL

SQL is suitable because the application requires relationships, foreign-key constraints, reliable transactions and JOINs across users, notes and tags. A relational database provides strong data integrity and makes the ownership model explicit. NoSQL could suit particular flexible or high-volume workloads, but the structured relationships make SQL the best starting point for this system.
