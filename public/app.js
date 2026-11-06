const form = document.querySelector("#course-form");
const courseIdInput = document.querySelector("#course-id");
const nameInput = document.querySelector("#course-name");
const creditsInput = document.querySelector("#course-credits");

const courseList = document.querySelector("#course-list");
const emptyMessage = document.querySelector("#empty-message");
const statusBox = document.querySelector("#status");

const formTitle = document.querySelector("#form-title");
const addButton = document.querySelector("#add-button");
const cancelButton = document.querySelector("#cancel-button");
const refreshButton = document.querySelector("#refresh-button");

function showStatus(message, type = "") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function resetForm() {
  form.reset();
  courseIdInput.value = "";
  formTitle.textContent = "Add New Course";
  addButton.textContent = "Add Course";
  cancelButton.hidden = true;
}

function setEditMode(course) {
  courseIdInput.value = course.id;
  nameInput.value = course.name;
  creditsInput.value = course.credits;
  formTitle.textContent = `Edit Course (ID: ${course.id})`;
  addButton.textContent = "Update Course";
  cancelButton.hidden = false;
  nameInput.focus();
}

function renderCourses(courses) {
  courseList.replaceChildren();
  emptyMessage.hidden = courses.length > 0;
  for (const course of courses) {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = course.id;

    const nameCell = document.createElement("td");
    nameCell.textContent = course.name;

    const creditsCell = document.createElement("td");
    creditsCell.textContent = course.credits;

    // Actions cell (Edit and Delete)
    const actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "edit-button";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => setEditMode(course));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "danger-button";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => handleDelete(course.id, course.name));

    actionsCell.append(editBtn, deleteBtn);
    row.append(idCell, nameCell, creditsCell, actionsCell);
    courseList.appendChild(row);
  }
}

async function loadCourses() {
  refreshButton.disabled = true;
  showStatus("Loading courses...", "loading");

  try {
    const response = await fetch("/api/courses");
    if (!response.ok) {
      throw new Error(`Failed to load courses (HTTP ${response.status})`);
    }

    const courses = await response.json();
    if (!Array.isArray(courses)) {
      throw new Error("Invalid API response format");
    }

    renderCourses(courses);
    showStatus(`Successfully loaded ${courses.length} courses.`, "success");
    return true;

  } catch (error) {
    console.error("GET courses failed:", error);
    showStatus(error.message, "error");
    return false;

  } finally {
    refreshButton.disabled = false;
  }
}

async function createCourse(name, credits) {
  const response = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, credits })
  });

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.error === "string") message = errorData.error;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function updateCourse(id, name, credits) {
  const response = await fetch(`/api/courses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, credits })
  });

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.error === "string") message = errorData.error;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function deleteCourse(id) {
  const response = await fetch(`/api/courses/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    let message = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      if (typeof errorData.error === "string") message = errorData.error;
    } catch {}
    throw new Error(message);
  }
  return response.json();
}

async function handleDelete(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) {
    return;
  }

  showStatus(`Deleting course "${name}"...`, "loading");
  try {
    await deleteCourse(id);
    await loadCourses();
    showStatus(`Course "${name}" deleted successfully.`, "success");
  } catch (error) {
    console.error("DELETE course failed:", error);
    showStatus(error.message, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = courseIdInput.value;
  const name = nameInput.value.trim();
  const credits = Number(creditsInput.value);

  if (
    name.length === 0 ||
    name.length > 150 ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 6
  ) {
    showStatus("Please enter valid course data.", "error");
    return;
  }

  addButton.disabled = true;
  showStatus(id ? "Updating course..." : "Creating course...", "loading");

  try {
    if (id) {
      const updatedCourse = await updateCourse(id, name, credits);
      resetForm();
      await loadCourses();
      showStatus(`Course "${updatedCourse.name}" updated successfully.`, "success");
    } else {
      const newCourse = await createCourse(name, credits);
      resetForm();
      await loadCourses();
      showStatus(`Course "${newCourse.name}" created successfully.`, "success");
    }
  } catch (error) {
    console.error("Save course failed:", error);
    showStatus(error.message, "error");
  } finally {
    addButton.disabled = false;
  }
});

cancelButton.addEventListener("click", resetForm);
refreshButton.addEventListener("click", loadCourses);

loadCourses();