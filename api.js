
const API_URL = "https://jsonplaceholder.typicode.com/posts";

const loadButton = document.getElementById("load-btn");
const noteForm = document.getElementById("note-form");
const titleInput = document.getElementById("title-input");
const bodyInput = document.getElementById("body-input");
const submitButton = document.getElementById("submit-btn");
const notesList = document.getElementById("notes-list");
const statusElement = document.getElementById("status");

let notes = [];
let activeRequests = 0;

// Reusable request helper: checks HTTP errors and returns response data.
async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  const data = response.status === 204 ? null : await response.json();

  return { data, status: response.status };
}

function showStatus(message, type = "") {
  statusElement.textContent = message;
  statusElement.className = type;
}

function setBusy(button, busy) {
  button.disabled = busy;
}

function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "No notes to display. Load or create a note.";
    notesList.appendChild(emptyItem);
    return;
  }

  notes.forEach((note) => {
    const item = document.createElement("li");
    item.className = "note-item";

    const heading = document.createElement("h3");
    heading.textContent = note.title || "Untitled note";

    const body = document.createElement("p");
    body.textContent = note.body || "";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";
    deleteButton.disabled = activeRequests > 0;

    deleteButton.addEventListener("click", () => {
      deleteNote(note.id);
    });

    item.append(heading, body, deleteButton);
    notesList.appendChild(item);
  });
}

// Task 1: GET the first 10 notes.
async function loadNotes() {
  if (activeRequests > 0) return;

  activeRequests++;
  setBusy(loadButton, true);
  setBusy(submitButton, true);
  showStatus("Loading notes...");

  try {
    const result = await request(`${API_URL}?_limit=10`);
    notes = result.data;
    renderNotes();

    if (notes.length === 0) {
      showStatus("No notes found.", "success");
    } else {
      showStatus(`Loaded ${notes.length} notes from the server.`, "success");
    }
  } catch (error) {
    showStatus("Sorry, we couldn't load notes. Please try again.", "error");
  } finally {
    activeRequests--;
    setBusy(loadButton, false);
    setBusy(submitButton, false);
    renderNotes();
  }
}

// Task 2: POST a new note.
async function createNote(event) {
  event.preventDefault();

  if (activeRequests > 0) return;

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must not exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  activeRequests++;
  setBusy(submitButton, true);
  setBusy(loadButton, true);
  showStatus("Creating note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      body: JSON.stringify({ title, body, userId: 1 })
    });

    const createdNote = result.data;

    // JSONPlaceholder simulates POST and does not persist the new note.
    // Keep the returned note in this browser session so the demo remains usable.
    notes.unshift(createdNote);
    renderNotes();
    noteForm.reset();

    showStatus(
      `Note created (status ${result.status}, id ${createdNote.id}).`,
      "success"
    );
  } catch (error) {
    showStatus("Sorry, we couldn't create the note. Please try again.", "error");
  } finally {
    activeRequests--;
    setBusy(submitButton, false);
    setBusy(loadButton, false);
    renderNotes();
  }
}

// Task 3: DELETE a note.
async function deleteNote(id) {
  if (activeRequests > 0) return;

  activeRequests++;
  setBusy(loadButton, true);
  setBusy(submitButton, true);
  showStatus("Deleting note...");

  try {
    const result = await request(`${API_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    notes = notes.filter((note) => String(note.id) !== String(id));
    renderNotes();

    showStatus(
      `Note deleted (status ${result.status}, id ${id}).`,
      "success"
    );
  } catch (error) {
    showStatus("Sorry, we couldn't delete the note. Please try again.", "error");
  } finally {
    activeRequests--;
    setBusy(loadButton, false);
    setBusy(submitButton, false);
    renderNotes();
  }
}

loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

renderNotes();
