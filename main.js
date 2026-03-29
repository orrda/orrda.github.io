// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Filter logic
const filterBtns = document.querySelectorAll('.filter-btn');
let cards = document.querySelectorAll('.project-card');
const countEl = document.getElementById('project-count');

function updateCount() {
  const visible = [...cards].filter(c => !c.classList.contains('hidden')).length;
  countEl.textContent = visible + ' project' + (visible !== 1 ? 's' : '');
}

// Load projects dynamically
async function loadProjects() {
  const projectGrid = document.getElementById('projects-grid');
  if (!projectGrid) return;
  const projectFolders = [
    'analytic-and-function',
    'circular-binaries',
    'self-similar-pdes',
    'stochastic-butcher',
    'active-learning',
    'twinkling-lights'
  ];

  let projects = [];

  // Fetch each project
  for (const folder of projectFolders) {
    try {
      // First try to load the postcard.html file which contains the metadata/summary
      const response = await fetch(`projects/${folder}/postcard.html`);
      let html = '';
      if (!response.ok) {
        // If there's no postcard, just fall back to index.html for metadata extraction
        const indexResponse = await fetch(`projects/${folder}/index.html`);
        if (!indexResponse.ok) continue;
        html = await indexResponse.text();
      } else {
        html = await response.text();
      }
      
      const lastModifiedHeader = response.headers.get('Last-Modified');
      const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : new Date(0);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const titleEl = doc.querySelector('.project-title');
      let title = titleEl ? titleEl.innerHTML : folder.replace('-', ' ');

      // Try to get abstract: first <p> in .project-body
      const firstP = doc.querySelector('.project-body p');
      let abstract = '';
      if (firstP) {
        abstract = firstP.innerHTML;
        // Optionally truncate if you still want to
        // if (abstract.length > 200) { abstract = abstract.substring(0, 197) + '...'; }
      } else {
        abstract = html; // if postcard is just a raw summary
      }

      // Get category from tag
      const tagEl = doc.querySelector('.card-tag');
      let category = 'math'; // default
      let tagText = 'Mathematics';
      if (tagEl) {
        if (tagEl.classList.contains('physics')) {
          category = 'physics';
          tagText = 'Physics';
        } else {
          category = 'math';
          tagText = 'Mathematics';
        }
      }

      projects.push({
        folder,
        title,
        abstract,
        category,
        tagText,
        lastModified
      });
    } catch (err) {
      console.error(`Failed to load ${folder}:`, err);
    }
  }

  // Fallback to static order if no Last-Modified headers are present (e.g. file:// protocol)
  if (projects.every(p => p.lastModified.getTime() === 0)) {
     // If Last-Modified isn't available, we could default string sorting or just rely on manual ordering 
     // but we'll try to fetch modified times via github API or something if needed. 
     // Right now it leaves the order as-is or relies on 'new Date(0)' which makes them equal.
  } else {
    // Sort projects by last updated (newest first)
    projects.sort((a, b) => b.lastModified - a.lastModified);
  }

  // Render projects
  projectGrid.innerHTML = '';
  projects.forEach(proj => {
    const article = document.createElement('article');
    article.className = 'project-card';
    article.dataset.category = proj.category;
    article.onclick = () => window.location.href = `projects/${proj.folder}/index.html`;

    article.innerHTML = `
      <div class="card-meta">
        <span class="card-tag ${proj.category}">${proj.tagText}</span>
        <span class="card-status">
          <span class="status-dot"></span>In progress
        </span>
      </div>
      <h3 class="card-title">
        <a href="projects/${proj.folder}/index.html">${proj.title}</a>
      </h3>
      ${proj.abstract ? `<p class="card-description">${proj.abstract}</p>` : ''}
    `;
    projectGrid.appendChild(article);
  });

  // Re-select cards for filtering
  cards = document.querySelectorAll('.project-card');
  updateCount();
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    cards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      card.classList.toggle('hidden', !match);
    });
    updateCount();
  });
});

// Fetch projects on load
loadProjects();
