
# QuickNotes System Design

QuickNotes is a notes application project that demonstrates frontend API integration, REST API design, relational data modeling and scalable system architecture.

## Features

- Load 10 notes with GET requests.
- Create notes with POST requests.
- Delete notes with DELETE requests.
- Validate note titles and show request status messages.
- Handle loading, success, error and empty states.
- Document the production API, database and system architecture.

## Technologies

- HTML5 and CSS3
- JavaScript Fetch API and async/await
- JSONPlaceholder practice API
- MySQL 8
- Markdown

## Project Structure

```text
quicknotes-system-design/
├── index.html
├── api.js
├── style.css
├── README.md
└── docs/
    ├── api-design.md
    ├── data-model.md
    └── architecture.md
```

## How to Run the API Client

1. Clone the repository:

   ```bash
   git clone https://github.com/90hillart/quicknotes-system-design.git
   ```

2. Open the folder:

   ```bash
   cd quicknotes-system-design
   ```

3. Open `index.html` in a browser, or run it using the Live Server extension in VS Code.

4. Click **Load notes** to retrieve notes from JSONPlaceholder.

5. Use the form to create notes and the Delete buttons to remove notes from the displayed list.

An internet connection is required for API requests.

## Documentation

- [API Design](docs/api-design.md)
- [Data Model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I Learned

1. How to use asynchronous JavaScript and Fetch API for GET, POST and DELETE requests.
2. How to validate form input and present loading, success, error and empty states.
3. How REST endpoints and HTTP status codes support API design.
4. How primary keys, foreign keys and junction tables model relational data.
5. How load balancers, caches, read replicas and queues support scalability.
6. How to estimate requests per second and annual data storage.

## Limitations

JSONPlaceholder is a practice API. It simulates creating and deleting resources but does not permanently persist these changes. The browser keeps changes in its current in-memory list only. A production service requires a persistent backend, authentication, authorization, server-side validation and a real database.

## Author

WANJALA HILARY WEKESA
