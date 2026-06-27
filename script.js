const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");

const getStoredTheme = () => {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
};

const setStoredTheme = (theme) => {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // The visual toggle should still work if storage is unavailable.
  }
};

const setTheme = (isDark) => {
  root.classList.toggle("dark", isDark);
  toggle?.setAttribute("aria-pressed", String(isDark));
};

const savedTheme = getStoredTheme();
const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;

setTheme(savedTheme ? savedTheme === "dark" : Boolean(prefersDark));

toggle?.addEventListener("click", () => {
  const isDark = !root.classList.contains("dark");
  setTheme(isDark);
  setStoredTheme(isDark ? "dark" : "light");
});

const blogSearch = document.querySelector(".blog-search-input");
const blogRows = [...document.querySelectorAll(".blog-row")];
const blogEmpty = document.querySelector(".blog-empty");
const endMarker = document.querySelector(".end-marker");

blogSearch?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLowerCase();
  let visibleCount = 0;

  blogRows.forEach((row) => {
    const haystack = [
      row.dataset.title,
      row.dataset.category,
      row.dataset.summary,
      row.textContent,
    ]
      .join(" ")
      .toLowerCase();
    const isVisible = haystack.includes(query);

    row.hidden = !isVisible;
    visibleCount += isVisible ? 1 : 0;
  });

  if (blogEmpty) {
    blogEmpty.hidden = visibleCount !== 0;
  }

  if (endMarker) {
    endMarker.hidden = visibleCount === 0;
  }
});
