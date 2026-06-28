const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const posts = (Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [])
  .slice()
  .sort((a, b) => new Date(`${b.date}T00:00:00`) - new Date(`${a.date}T00:00:00`));

const formatDate = (dateString) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));

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

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.pushState(null, "", link.getAttribute("href"));
  });
});

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
};

const articleUrl = (slug) => `post.html?slug=${encodeURIComponent(slug)}`;

const blockText = (block) => {
  if (Array.isArray(block.items)) {
    return block.items.join(" ");
  }

  return [block.label, block.text, block.caption, block.alt].filter(Boolean).join(" ");
};

const renderBlogIndex = () => {
  const blogList = document.querySelector(".blog-list");
  const searchInput = document.querySelector(".blog-search-input");
  const blogEmpty = document.querySelector(".blog-empty");
  const endMarker = document.querySelector(".end-marker");
  const pagination = document.querySelector(".blog-pagination");
  const articleCount = document.querySelector("[data-blog-count]");
  const minuteCount = document.querySelector("[data-blog-minutes]");
  const pageSize = Number(blogList?.dataset.pageSize || 2);

  if (!blogList) {
    return;
  }

  let currentPage = 1;
  let currentQuery = "";

  if (articleCount) {
    articleCount.textContent = String(posts.length);
  }

  if (minuteCount) {
    const minutes = posts.reduce((sum, post) => sum + post.readTime, 0);
    minuteCount.textContent = `~${minutes}`;
  }

  const buildRow = (post) => {
    const row = createElement("article", "blog-row");
    row.dataset.title = post.title;
    row.dataset.category = post.category;
    row.dataset.summary = post.summary;

    const date = createElement("div", "blog-date");

    if (post.featured) {
      date.append(createElement("span", "featured-label", "Featured"));
    }

    const time = document.createElement("time");
    time.dateTime = post.date;
    time.textContent = formatDate(post.date);
    date.append(time, createElement("span", "", "\u2014"));

    const link = createElement("a", "blog-post-link");
    link.href = articleUrl(post.slug);
    link.append(createElement("h2", "", post.title));
    link.append(createElement("p", "", post.summary));
    link.append(createElement("span", "article-tag", post.category));

    const readTime = createElement("p", "read-time", `${post.readTime} min read`);

    const arrow = createElement("a", "blog-arrow", "\u2192");
    arrow.href = articleUrl(post.slug);
    arrow.setAttribute("aria-label", `Read ${post.title}`);

    row.append(date, link, readTime, arrow);
    return row;
  };

  const buildPagination = (totalPages) => {
    pagination.replaceChildren();

    if (totalPages <= 1) {
      pagination.hidden = true;
      return;
    }

    pagination.hidden = false;

    for (let page = 1; page <= totalPages; page += 1) {
      const button = createElement("button", "page-button", String(page));
      button.type = "button";
      button.setAttribute("aria-label", `Show blog page ${page}`);
      button.setAttribute("aria-current", page === currentPage ? "page" : "false");
      button.addEventListener("click", () => {
        currentPage = page;
        render();
        document.querySelector(".blog-index")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
      pagination.append(button);
    }
  };

  const render = () => {
    const normalizedQuery = currentQuery.toLowerCase();
    const filteredPosts = posts
      .map((post, index) => {
        if (!normalizedQuery) {
          return { post, rank: 0, index };
        }

        const title = post.title.toLowerCase();
        const category = post.category.toLowerCase();
        const summary = post.summary.toLowerCase();
        const body = (post.body || []).map(blockText).join(" ").toLowerCase();

        if (title.includes(normalizedQuery)) {
          return { post, rank: 1, index };
        }

        if (category.includes(normalizedQuery)) {
          return { post, rank: 2, index };
        }

        if (summary.includes(normalizedQuery)) {
          return { post, rank: 3, index };
        }

        if (body.includes(normalizedQuery)) {
          return { post, rank: 4, index };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map((result) => result.post);
    const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));

    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visiblePosts = filteredPosts.slice(start, start + pageSize);

    blogList.replaceChildren(...visiblePosts.map(buildRow));
    blogEmpty.hidden = filteredPosts.length !== 0;
    endMarker.hidden = filteredPosts.length === 0;
    buildPagination(totalPages);
  };

  searchInput?.addEventListener("input", (event) => {
    currentQuery = event.target.value.trim();
    currentPage = 1;
    render();
  });

  render();
};

const renderPostPage = () => {
  const article = document.querySelector("[data-post-page]");

  if (!article) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || posts[0]?.slug;
  const postIndex = posts.findIndex((entry) => entry.slug === slug);
  const post = posts[postIndex];

  if (!post) {
    article.replaceChildren();
    article.append(
      createElement("a", "article-back", "\u2190 Back to blog"),
      createElement("h1", "", "Post not found"),
      createElement("p", "article-dek", "That article could not be found."),
    );
    return;
  }

  document.title = `${post.title} | Rushil Rawat`;

  const description = document.querySelector('meta[name="description"]');
  description?.setAttribute("content", post.summary);

  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute("content", `${post.title} | Rushil Rawat`);
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute("content", post.summary);

  const back = createElement("a", "article-back", "\u2190 Back to blog");
  back.href = "blog.html";

  const header = createElement("header", "article-header");
  header.append(
    createElement("p", "article-kicker", post.category),
    createElement("h1", "", post.title),
    createElement("p", "article-dek", post.summary),
  );

  const meta = createElement("div", "article-meta");
  meta.append(
    createElement("span", "", formatDate(post.date)),
    createElement("span", "", `${post.readTime} min read`),
    createElement("span", "", "Rushil Rawat"),
  );
  header.append(meta);

  const body = createElement("div", "article-body");

  post.body.forEach((block) => {
    if (block.type === "heading") {
      body.append(createElement("h2", "", block.text));
    }

    if (block.type === "paragraph") {
      body.append(createElement("p", "", block.text));
    }

    if (block.type === "quote") {
      body.append(createElement("blockquote", "", block.text));
    }

    if (block.type === "callout") {
      const callout = createElement("aside", "article-callout");
      callout.append(
        createElement("span", "article-callout-label", block.label),
        createElement("p", "", block.text),
      );
      body.append(callout);
    }

    if (block.type === "list") {
      const list = createElement("ul", "article-list");
      block.items.forEach((item) => {
        list.append(createElement("li", "", item));
      });
      body.append(list);
    }

    if (block.type === "code") {
      const pre = createElement("pre", "article-code");
      const code = document.createElement("code");
      code.textContent = block.text;
      pre.append(code);
      body.append(pre);
    }

    if (block.type === "image") {
      const figure = createElement("figure", "article-figure");
      const image = document.createElement("img");
      image.src = block.src;
      image.alt = block.alt;
      image.loading = "lazy";
      const caption = createElement("figcaption", "", block.caption);
      figure.append(image, caption);
      body.append(figure);
    }
  });

  const nextPost = posts[postIndex - 1];
  const previousPost = posts[postIndex + 1];
  const footer = createElement("nav", "article-post-nav");
  footer.setAttribute("aria-label", "Post navigation");

  const nextLink = createElement("a", "article-nav-card");
  if (nextPost) {
    nextLink.href = articleUrl(nextPost.slug);
    nextLink.append(
      createElement("span", "article-footer-label", "\u2190 Next"),
      createElement("strong", "", nextPost.title),
    );
  } else {
    nextLink.setAttribute("aria-disabled", "true");
    nextLink.append(
      createElement("span", "article-footer-label", "\u2190 Next"),
      createElement("strong", "", "No next post"),
    );
  }

  const previousLink = createElement("a", "article-nav-card");
  if (previousPost) {
    previousLink.href = articleUrl(previousPost.slug);
    previousLink.append(
      createElement("span", "article-footer-label", "Previous \u2192"),
      createElement("strong", "", previousPost.title),
    );
  } else {
    previousLink.setAttribute("aria-disabled", "true");
    previousLink.append(
      createElement("span", "article-footer-label", "Previous \u2192"),
      createElement("strong", "", "No previous post"),
    );
  }

  footer.append(nextLink, previousLink);
  article.replaceChildren(back, header, body, footer);
};

renderBlogIndex();
renderPostPage();
