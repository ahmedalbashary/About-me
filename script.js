/**
 * Ahmed Ashraf – script.js
 * Handles: posts grid (home + blog), single post, hamburger menu
 */

const POSTS_JSON_PATH = 'posts.json';

function getUrlParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function readingTime(html) {
  const text = html.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function fetchPosts() {
  try {
    const res = await fetch(POSTS_JSON_PATH);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.posts;
  } catch (err) {
    console.error('Error fetching posts:', err);
    return null;
  }
}

function buildPostCard(post, index) {
  const rt = readingTime(post.content);
  const tagsHTML = post.tags.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('');
  return `
    <a href="post.html?id=${encodeURIComponent(post.id)}" class="post-card" style="animation-delay:${0.05 + index * 0.1}s">
      <div class="post-image-wrap">
        <img src="${post.image}" alt="${post.title}" class="post-image" loading="lazy">
        <div class="post-image-overlay"></div>
      </div>
      <div class="post-body">
        <div class="post-meta">
          <span class="post-date">${formatDate(post.date)}</span>
          <span class="post-meta-dot"></span>
          <span class="post-readtime">${rt} min read</span>
        </div>
        <h2 class="post-title">${post.title}</h2>
        <p class="post-description">${post.description}</p>
        <div class="post-tags">${tagsHTML}</div>
        <span class="read-more">
          Read article
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </span>
      </div>
    </a>`;
}

/* Homepage — show latest 3 posts */
async function renderHomePosts() {
  const grid = document.getElementById('home-posts-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading">Loading posts</div>';
  const posts = await fetchPosts();
  if (!posts) { grid.innerHTML = '<div class="error">Failed to load posts.</div>'; return; }
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = posts.slice(0, 3).map((p, i) => buildPostCard(p, i)).join('');
}

/* Blog page — show all posts */
async function renderPostsList() {
  const grid = document.getElementById('posts-grid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading">Loading posts</div>';
  const posts = await fetchPosts();
  if (!posts) { grid.innerHTML = '<div class="error">Failed to load posts.</div>'; return; }
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = posts.map((p, i) => buildPostCard(p, i)).join('');
}

/* Single post page */
async function renderSinglePost() {
  const container = document.getElementById('post-content');
  if (!container) return;
  const postId = getUrlParam('id');
  if (!postId) {
    container.innerHTML = `<div class="error">No post specified. <a href="research.html">← Go back</a></div>`;
    return;
  }
  container.innerHTML = '<div class="loading">Loading article</div>';
  const posts = await fetchPosts();
  if (!posts) { container.innerHTML = `<div class="error">Failed to load. <a href="research.html">← Go back</a></div>`; return; }
  const post = posts.find(p => p.id === postId);
  if (!post) { container.innerHTML = `<div class="error">Post not found. <a href="research.html">← Go back</a></div>`; return; }
  document.title = `${post.title} | Ahmed Ashraf`;
  const rt = readingTime(post.content);
  const tagsHTML = post.tags.map(t => `<span class="tag">${t}</span>`).join('');
  container.innerHTML = `
    <header class="post-header">
      <div class="post-meta">
        <span class="post-date">${formatDate(post.date)}</span>
        <span class="post-meta-dot"></span>
        <span class="post-readtime">${rt} min read</span>
      </div>
      <h1 class="post-title-large">${post.title}</h1>
      <p class="post-description-hero">${post.description}</p>
      <div class="post-tags">${tagsHTML}</div>
    </header>
    <img src="${post.image}" alt="${post.title}" class="post-featured-image" loading="eager">
    <div class="post-article">${post.content}</div>`;
}

/* Hamburger */
function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (!btn || !navLinks) return;
  btn.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
    const spans = btn.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => s.removeAttribute('style'));
    }
  });
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.querySelectorAll('span').forEach(s => s.removeAttribute('style'));
    }
  });
}

function init() {
  initHamburger();
  const path = window.location.pathname;
  if (path.includes('post.html') || document.getElementById('post-content')) {
    renderSinglePost();
  } else if (path.includes('research.html') || document.getElementById('posts-grid')) {
    renderPostsList();
  }
  if (document.getElementById('home-posts-grid')) {
    renderHomePosts();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
