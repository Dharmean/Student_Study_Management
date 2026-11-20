(function () {
  "use strict";

  const V2_KEY = "student-study-manager-v2";
  const V1_KEY = "student-study-manager-v1";

  const DEPARTMENT_GROUPS = [
    {
      faculty: "Faculty of Engineering and Environmental Sciences",
      items: [
        "Automotive Engineering", "Civil Engineering", "Computer Engineering",
        "Electrical and Electronics Engineering", "Information and Communication Engineering",
        "Mechanical Engineering", "Mechatronics Engineering", "Architecture",
        "Estate Management", "Quantity Surveying"
      ]
    },
    {
      faculty: "Faculty of Basic and Applied Sciences",
      items: [
        "Applied Geophysics", "Biochemistry", "Biological Sciences", "Biotechnology",
        "Computer Science", "Cyber Security", "Environmental Management and Toxicology",
        "Mathematics and Computer Science", "Microbiology", "Physical and Chemical Sciences",
        "Physics with Electronics", "Software Engineering"
      ]
    },
    {
      faculty: "Faculty of Humanities, Social and Management Sciences",
      items: [
        "Accounting", "Banking and Finance", "Business Administration", "Economics",
        "English", "History and International Relations", "Hotel Management and Tourism",
        "Human Resource Management", "International Relations and Diplomacy",
        "Mass Communication", "Office and Information Management",
        "Performing and Film Arts", "Political Science", "Public Administration", "Sociology"
      ]
    },
    {
      faculty: "Faculty of Allied Health Sciences",
      items: ["Human Anatomy", "Human Physiology", "Medical Laboratory Science", "Nursing Science"]
    },
    {
      faculty: "Faculty of Law",
      items: ["Law"]
    },
    {
      faculty: "College of Health Sciences",
      items: ["Medicine and Surgery (MBBS)"]
    },
    {
      faculty: "General Studies",
      items: ["General Studies"]
    }
  ];

  const GRADE_BANDS = [
    { min: 70, letter: "A", point: 5 },
    { min: 60, letter: "B", point: 4 },
    { min: 50, letter: "C", point: 3 },
    { min: 45, letter: "D", point: 2 },
    { min: 40, letter: "E", point: 1 },
    { min: 0, letter: "F", point: 0 }
  ];

  const DEPARTMENTS = DEPARTMENT_GROUPS.reduce(function (all, group) {
    return all.concat(group.items);
  }, []);

  const els = {
    studentName: document.getElementById("studentName"),
    profileForm: document.getElementById("profileForm"),
    nameInput: document.getElementById("nameInput"),
    todayDate: document.getElementById("todayDate"),
    courseCount: document.getElementById("courseCount"),
    assignmentCount: document.getElementById("assignmentCount"),
    taskCount: document.getElementById("taskCount"),
    statCgpa: document.getElementById("statCgpa"),
    taskForm: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    taskMessage: document.getElementById("taskMessage"),
    taskList: document.getElementById("taskList"),
    taskEmpty: document.getElementById("taskEmpty"),
    clearCompletedBtn: document.getElementById("clearCompletedBtn"),
    assignmentForm: document.getElementById("assignmentForm"),
    assignmentInput: document.getElementById("assignmentInput"),
    assignmentMessage: document.getElementById("assignmentMessage"),
    assignmentList: document.getElementById("assignmentList"),
    assignmentEmpty: document.getElementById("assignmentEmpty"),
    courseForm: document.getElementById("courseForm"),
    courseDepartment: document.getElementById("courseDepartment"),
    courseCode: document.getElementById("courseCode"),
    courseUnits: document.getElementById("courseUnits"),
    courseMessage: document.getElementById("courseMessage"),
    courseList: document.getElementById("courseList"),
    courseEmpty: document.getElementById("courseEmpty"),
    cgpaEmpty: document.getElementById("cgpaEmpty"),
    cgpaTable: document.getElementById("cgpaTable"),
    cgpaList: document.getElementById("cgpaList"),
    cgpaMessage: document.getElementById("cgpaMessage"),
    cgpaResult: document.getElementById("cgpaResult"),
    resultCount: document.getElementById("resultCount"),
    courseTotalCount: document.getElementById("courseTotalCount"),
    totalCredits: document.getElementById("totalCredits"),
    totalPoints: document.getElementById("totalPoints"),
    cgpaClass: document.getElementById("cgpaClass"),
    calculateCgpaBtn: document.getElementById("calculateCgpaBtn")
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  function initialState() {
    return {
      name: "Student",
      tasks: [
        { id: uid(), text: "Complete JavaScript assignment", done: false },
        { id: uid(), text: "Read Computer Science notes", done: false },
        { id: uid(), text: "Prepare for Mathematics test", done: false },
        { id: uid(), text: "Complete SIWES documentation", done: false }
      ],
      assignments: [],
      courses: []
    };
  }

  function normalizeTextItems(value, withDone) {
    if (!Array.isArray(value)) return [];
    return value.reduce(function (items, entry) {
      if (!entry || typeof entry.text !== "string" || !entry.text.trim()) return items;
      const item = {
        id: typeof entry.id === "string" && entry.id ? entry.id : uid(),
        text: entry.text.trim().slice(0, 80)
      };
      if (withDone) item.done = Boolean(entry.done);
      items.push(item);
      return items;
    }, []);
  }

  function normalizeCourseCode(raw) {
    const code = String(raw || "").toUpperCase().replace(/\s+/g, " ").trim();
    const match = code.match(/^([A-Z]{2,6}(?:-[A-Z]{2,6})?)\s*(\d{3}[A-Z]?)$/);
    return match ? match[1] + " " + match[2] : code;
  }

  function isValidCourseCode(code) {
    return /^[A-Z]{2,6}(?:-[A-Z]{2,6})? \d{3}[A-Z]?$/.test(code);
  }

  function parseUnits(raw) {
    const value = Number(String(raw === null || raw === undefined ? "" : raw).trim());
    return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
  }

  function normalizeScore(value) {
    if (value === null || value === undefined || value === "") return null;
    const score = Number(value);
    return Number.isInteger(score) && score >= 0 && score <= 100 ? score : null;
  }

  function normalizeCourses(value) {
    if (!Array.isArray(value)) return [];
    const seen = Object.create(null);
    return value.reduce(function (courses, entry, index) {
      if (!entry || typeof entry !== "object") return courses;

      let department = "";
      let code = "";
      let units = null;
      let score = null;

      if (typeof entry.code === "string") {
        department = typeof entry.department === "string" && entry.department.trim()
          ? entry.department.trim()
          : "General Studies";
        code = normalizeCourseCode(entry.code);
        units = parseUnits(entry.units);
        score = normalizeScore(entry.score);
      } else if (typeof entry.text === "string" && entry.text.trim()) {
        department = "General Studies";
        code = normalizeCourseCode(entry.text);
        if (!isValidCourseCode(code)) code = "GEN " + (100 + index);
        units = 1;
      }

      if (!isValidCourseCode(code) || units === null) return courses;
      const key = code.toLowerCase();
      if (seen[key]) return courses;
      seen[key] = true;

      courses.push({
        id: typeof entry.id === "string" && entry.id ? entry.id : uid(),
        department: department.slice(0, 60),
        code: code,
        units: units,
        score: score
      });
      return courses;
    }, []);
  }

  function loadState() {
    try {
      let raw = window.localStorage.getItem(V2_KEY);
      if (!raw) raw = window.localStorage.getItem(V1_KEY);
      if (!raw) return initialState();
      const saved = JSON.parse(raw);
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return initialState();
      return {
        name: typeof saved.name === "string" && saved.name.trim() ? saved.name.trim().slice(0, 40) : "Student",
        tasks: normalizeTextItems(saved.tasks, true),
        assignments: normalizeTextItems(saved.assignments, false),
        courses: normalizeCourses(saved.courses)
      };
    } catch (error) {
      return initialState();
    }
  }

  let state = loadState();

  function saveState() {
    try {
      window.localStorage.setItem(V2_KEY, JSON.stringify(state));
    } catch (error) {}
  }

  function setFeedback(element, message, isError) {
    element.textContent = message || "";
    element.classList.toggle("is-error", Boolean(isError));
  }

  function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function removeById(items, id) {
    const index = items.findIndex(function (item) {
      return item.id === id;
    });
    if (index !== -1) items.splice(index, 1);
  }

  function findCourse(id) {
    return state.courses.find(function (course) {
      return course.id === id;
    });
  }

  function hasDuplicate(items, text) {
    const needle = text.toLowerCase();
    return items.some(function (item) {
      return item.text.toLowerCase() === needle;
    });
  }

  function scoreToGrade(score) {
    if (score === null || score === undefined) return null;
    for (let i = 0; i < GRADE_BANDS.length; i += 1) {
      if (score >= GRADE_BANDS[i].min) return GRADE_BANDS[i];
    }
    return GRADE_BANDS[GRADE_BANDS.length - 1];
  }

  function calculateCgpa() {
    let points = 0;
    let credits = 0;
    let scoredCount = 0;

    state.courses.forEach(function (course) {
      const band = scoreToGrade(course.score);
      if (!band) return;
      points += band.point * course.units;
      credits += course.units;
      scoredCount += 1;
    });

    return {
      value: credits > 0 ? (points / credits).toFixed(2) : "0.00",
      points: points,
      credits: credits,
      scoredCount: scoredCount
    };
  }

  function classify(value) {
    const gpa = Number(value);
    if (!Number.isFinite(gpa) || gpa <= 0) return "Add scores to see your classification";
    if (gpa >= 4.5) return "First Class Honours";
    if (gpa >= 3.5) return "Second Class Honours (Upper Division)";
    if (gpa >= 2.4) return "Second Class Honours (Lower Division)";
    if (gpa >= 1.5) return "Third Class Honours";
    if (gpa >= 1) return "Pass";
    return "Academic probation (below 1.00)";
  }

  function renderName() {
    els.studentName.textContent = state.name;
    els.nameInput.placeholder = state.name === "Student" ? "Your name" : state.name;
  }

  function renderDepartmentOptions() {
    DEPARTMENT_GROUPS.forEach(function (group) {
      const optgroup = document.createElement("optgroup");
      optgroup.label = group.faculty;
      group.items.forEach(function (department) {
        const option = document.createElement("option");
        option.value = department;
        option.textContent = department;
        optgroup.appendChild(option);
      });
      els.courseDepartment.appendChild(optgroup);
    });
  }

  function renderTasks() {
    els.taskList.replaceChildren();
    state.tasks.forEach(function (task) {
      const row = document.createElement("li");
      row.className = task.done ? "list-row is-complete" : "list-row";

      const text = document.createElement("span");
      text.className = "row-text";
      text.textContent = task.text;

      const actions = document.createElement("div");
      actions.className = "row-actions";
      actions.appendChild(makeButton(task.done ? "Undo" : "Complete", "btn-chip btn-complete", function () {
        task.done = !task.done;
        commit();
      }));
      actions.appendChild(makeButton("Delete", "btn-chip btn-danger", function () {
        removeById(state.tasks, task.id);
        commit();
      }));

      row.append(text, actions);
      els.taskList.appendChild(row);
    });

    els.taskCount.textContent = String(state.tasks.length);
    els.taskEmpty.hidden = state.tasks.length !== 0;
    els.clearCompletedBtn.disabled = !state.tasks.some(function (task) {
      return task.done;
    });
  }

  function renderAssignments() {
    els.assignmentList.replaceChildren();
    state.assignments.forEach(function (assignment) {
      const row = document.createElement("li");
      row.className = "list-row";

      const text = document.createElement("span");
      text.className = "row-text";
      text.textContent = assignment.text;

      const remove = makeButton("Delete", "btn-chip btn-danger", function () {
        removeById(state.assignments, assignment.id);
        commit();
      });

      row.append(text, remove);
      els.assignmentList.appendChild(row);
    });
    els.assignmentCount.textContent = String(state.assignments.length);
    els.assignmentEmpty.hidden = state.assignments.length !== 0;
  }

  function renderCourses() {
    els.courseList.replaceChildren();
    state.courses.forEach(function (course) {
      const row = document.createElement("li");
      row.className = "list-row course-row";

      const main = document.createElement("div");
      main.className = "course-row-main";

      const title = document.createElement("p");
      title.className = "course-row-title";
      const code = document.createElement("span");
      code.className = "course-code";
      code.textContent = course.code;
      title.appendChild(code);

      const meta = document.createElement("p");
      meta.className = "course-row-meta muted";
      const department = document.createElement("span");
      department.className = "course-dept";
      department.textContent = course.department;
      meta.appendChild(department);

      main.append(title, meta);

      const actions = document.createElement("div");
      actions.className = "row-actions course-row-actions";

      const badge = document.createElement("span");
      badge.className = "unit-badge";
      badge.textContent = course.units + (course.units === 1 ? " Unit" : " Units");
      badge.setAttribute("aria-label", course.units + " credit units");

      const remove = makeButton("Delete", "btn-chip btn-danger", function () {
        removeById(state.courses, course.id);
        commit();
        setFeedback(els.courseMessage, course.code + " removed from your register.", false);
      });
      remove.setAttribute("aria-label", "Delete " + course.code);

      actions.append(badge, remove);
      row.append(main, actions);
      els.courseList.appendChild(row);
    });

    els.courseCount.textContent = String(state.courses.length);
    els.courseEmpty.hidden = state.courses.length !== 0;
  }

  function updateScoreRow(course) {
    const row = Array.prototype.find.call(els.cgpaList.children, function (item) {
      return item.getAttribute("data-course-id") === course.id;
    });
    if (!row) return;

    const band = scoreToGrade(course.score);
    const grade = row.children[3];
    const points = row.children[4];

    grade.textContent = band ? band.letter + " / " + band.point.toFixed(1) : "—";
    if (band) grade.setAttribute("data-grade", band.letter);
    else grade.removeAttribute("data-grade");
    points.textContent = band ? (band.point * course.units).toFixed(2) : "0.00";
  }

  function renderScoreRows() {
    els.cgpaList.replaceChildren();
    state.courses.forEach(function (course) {
      const row = document.createElement("li");
      row.className = "list-row cgpa-row";
      row.setAttribute("data-course-id", course.id);

      const info = document.createElement("div");
      info.className = "cgpa-course";
      const code = document.createElement("span");
      code.className = "cgpa-code";
      code.textContent = course.code;
      const department = document.createElement("span");
      department.className = "cgpa-dept";
      department.textContent = course.department;
      info.append(code, department);

      const unit = document.createElement("span");
      unit.className = "cgpa-unit";
      unit.setAttribute("data-label", "Unit");
      unit.textContent = String(course.units);

      const field = document.createElement("div");
      field.className = "cgpa-score-field";
      field.setAttribute("data-label", "Score");
      const label = document.createElement("label");
      label.className = "sr-only";
      label.setAttribute("for", "score-" + course.id);
      label.textContent = "Score for " + course.code;
      const input = document.createElement("input");
      input.className = "cgpa-score";
      input.id = "score-" + course.id;
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.step = "1";
      input.placeholder = "0–100";
      input.setAttribute("data-course-id", course.id);
      input.setAttribute("aria-describedby", "grade-" + course.id);
      if (course.score !== null) input.value = String(course.score);
      field.append(label, input);

      const grade = document.createElement("span");
      grade.className = "cgpa-grade";
      grade.id = "grade-" + course.id;
      grade.setAttribute("data-label", "Grade");

      const points = document.createElement("span");
      points.className = "cgpa-points";
      points.setAttribute("data-label", "Points");

      row.append(info, unit, field, grade, points);
      els.cgpaList.appendChild(row);
      updateScoreRow(course);
    });
  }

  function renderCgpa() {
    const details = calculateCgpa();
    els.cgpaResult.textContent = details.value;
    els.statCgpa.textContent = details.value;
    els.totalCredits.textContent = String(details.credits);
    els.totalPoints.textContent = details.points.toFixed(2);
    els.resultCount.textContent = String(details.scoredCount);
    els.courseTotalCount.textContent = String(state.courses.length);
    els.cgpaClass.textContent = classify(details.value);
    els.cgpaEmpty.hidden = state.courses.length !== 0;
    els.cgpaTable.hidden = state.courses.length === 0;
  }

  function renderAll() {
    renderName();
    renderTasks();
    renderAssignments();
    renderCourses();
    renderScoreRows();
    renderCgpa();
  }

  function commit() {
    saveState();
    renderAll();
  }

  function wireAddForm(form, input, feedback, addItem) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) {
        setFeedback(feedback, "Please enter a value.", true);
        input.focus();
        return;
      }
      const outcome = addItem(value);
      setFeedback(feedback, outcome.message, outcome.error);
      if (!outcome.error) {
        input.value = "";
        input.focus();
      }
    });
  }

  els.profileForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const value = els.nameInput.value.trim();
    if (!value) {
      els.nameInput.focus();
      return;
    }
    state.name = value.slice(0, 40);
    els.nameInput.value = "";
    commit();
  });

  wireAddForm(els.taskForm, els.taskInput, els.taskMessage, function (value) {
    if (hasDuplicate(state.tasks, value)) {
      return { message: "That task is already on your list.", error: true };
    }
    state.tasks.push({ id: uid(), text: value, done: false });
    commit();
    return { message: "Task added.", error: false };
  });

  wireAddForm(els.assignmentForm, els.assignmentInput, els.assignmentMessage, function (value) {
    if (hasDuplicate(state.assignments, value)) {
      return { message: "That assignment is already on your list.", error: true };
    }
    state.assignments.push({ id: uid(), text: value });
    commit();
    return { message: "Assignment added.", error: false };
  });

  els.clearCompletedBtn.addEventListener("click", function () {
    const before = state.tasks.length;
    state.tasks = state.tasks.filter(function (task) {
      return !task.done;
    });
    if (state.tasks.length === before) return;
    commit();
    setFeedback(els.taskMessage, "Completed tasks cleared.", false);
  });

  els.courseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const department = els.courseDepartment.value;
    const code = normalizeCourseCode(els.courseCode.value);
    const units = parseUnits(els.courseUnits.value);

    if (DEPARTMENTS.indexOf(department) === -1) {
      setFeedback(els.courseMessage, "Select your department from the list.", true);
      els.courseDepartment.focus();
      return;
    }
    if (!isValidCourseCode(code)) {
      setFeedback(els.courseMessage, "Enter a course code like GST 111.", true);
      els.courseCode.focus();
      return;
    }
    if (units === null) {
      setFeedback(els.courseMessage, "Course unit must be a whole number from 1 to 5.", true);
      els.courseUnits.focus();
      return;
    }
    if (state.courses.some(function (course) {
      return course.code.toLowerCase() === code.toLowerCase();
    })) {
      setFeedback(els.courseMessage, code + " is already in your course register.", true);
      els.courseCode.focus();
      return;
    }

    state.courses.push({ id: uid(), department: department, code: code, units: units, score: null });
    commit();
    setFeedback(els.courseMessage, code + " added. Enter its score in the CGPA calculator.", false);
    els.courseCode.value = "";
    els.courseUnits.value = "";
    els.courseCode.focus();
  });

  els.cgpaList.addEventListener("input", function (event) {
    const target = event.target;
    if (!target.classList || !target.classList.contains("cgpa-score")) return;
    const course = findCourse(target.getAttribute("data-course-id"));
    if (!course) return;

    const raw = String(target.value).trim();
    if (raw === "") {
      course.score = null;
      target.removeAttribute("aria-invalid");
      updateScoreRow(course);
      renderCgpa();
      saveState();
      setFeedback(els.cgpaMessage, "", false);
      return;
    }

    const score = Number(raw);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      target.setAttribute("aria-invalid", "true");
      setFeedback(els.cgpaMessage, "Score must be a whole number from 0 to 100.", true);
      return;
    }

    course.score = score;
    target.removeAttribute("aria-invalid");
    updateScoreRow(course);
    renderCgpa();
    saveState();
    setFeedback(els.cgpaMessage, "", false);
  });

  els.cgpaList.addEventListener("change", function (event) {
    const target = event.target;
    if (!target.classList || !target.classList.contains("cgpa-score")) return;
    const course = findCourse(target.getAttribute("data-course-id"));
    if (!course) return;
    target.value = course.score === null ? "" : String(course.score);
    target.removeAttribute("aria-invalid");
  });

  els.calculateCgpaBtn.addEventListener("click", function () {
    const details = calculateCgpa();
    if (details.scoredCount === 0) {
      setFeedback(els.cgpaMessage, "Add at least one course score to generate your CGPA.", true);
      return;
    }
    setFeedback(
      els.cgpaMessage,
      "CGPA " + details.value + " from " + details.scoredCount + " scored courses and " + details.credits + " credit units.",
      false
    );
  });

  els.todayDate.textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const navLinks = Array.prototype.slice.call(document.querySelectorAll(".app-nav a"));
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.forEach(function (other) {
        other.classList.toggle("is-active", other === link);
      });
    });
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const active = navLinks.find(function (link) {
          return link.getAttribute("href") === "#" + entry.target.id;
        });
        if (!active) return;
        navLinks.forEach(function (other) {
          other.classList.toggle("is-active", other === active);
        });
      });
    }, { rootMargin: "-90px 0px -65% 0px" });

    document.querySelectorAll("main section[id]").forEach(function (section) {
      observer.observe(section);
    });
  }

  renderDepartmentOptions();
  renderAll();
})();
