// Set copyright year
document.getElementById('year').textContent = new Date().getFullYear();

// Define your project folders
const projectFolders = [
  'analytic-and-function',
  'circular-binaries',
  'self-similar-pdes',
  'stochastic-butcher',
  'active-learning',
  'twinkling-lights'
];

async function loadProjects() {
  const projectGrid = document.getElementById('projects-grid');
  if (!projectGrid) return;

  let projects = [];

  for (const folder of projectFolders) {
    try {
      // Fetch the postcard snippet
      const response = await fetch(`projects/${folder}/postcard.html`);
      if (!response.ok) {
        console.warn(`No postcard found for ${folder}, skipping.`);
        continue;
      }
      
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Extract Title
      const titleEl = doc.querySelector('.project-title');
      const title = titleEl ? titleEl.innerHTML : folder.replace(/-/g, ' ');

      // Extract Abstract/Body
      const bodyEl = doc.querySelector('.project-body');
      const abstract = bodyEl ? bodyEl.innerHTML : '';

      // Extract Category
      const tagEl = doc.querySelector('.card-tag');
      let category = 'math';
      let tagText = 'Mathematics';
      if (tagEl && tagEl.classList.contains('physics')) {
        category = 'physics';
        tagText = 'Physics';
      }

      // Get modification date for sorting (Defaults to 0 if headers aren't available)
      const lastModifiedHeader = response.headers.get('Last-Modified');
      const lastModified = lastModifiedHeader ? new Date(lastModifiedHeader) : new Date(0);

      projects.push({ folder, title, abstract, category, tagText, lastModified });
    } catch (err) {
      console.error(`Failed to load ${folder}:`, err);
    }
  }

  // Sort projects: newest first
  projects.sort((a, b) => b.lastModified - a.lastModified);

  // Render projects into the grid
  projectGrid.innerHTML = '';
  projects.forEach(proj => {
    const article = document.createElement('article');
    article.className = 'project-card';
    article.dataset.category = proj.category;
    
    // FIX: Link dynamically to the actual file (e.g., folder/folder.html)
    const projectUrl = `projects/${proj.folder}/${proj.folder}.html`;
    article.onclick = () => window.location.href = projectUrl;

    article.innerHTML = `
      <div class="card-meta">
        <span class="card-tag ${proj.category}">${proj.tagText}</span>
        <span class="card-status">
          <span class="status-dot"></span>In progress
        </span>
      </div>
      <h3 class="card-title">
        <a href="${projectUrl}">${proj.title}</a>
      </h3>
      <div class="card-description">${proj.abstract}</div>
    `;
    projectGrid.appendChild(article);
  });

  // FIX: Re-render KaTeX math equations inside dynamically loaded postcards
  if (window.renderMathInElement) {
    renderMathInElement(projectGrid, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ]
    });
  }

  initFilters();
}

function initFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  const countEl = document.getElementById('project-count');

  function updateCount() {
    const visible = [...cards].filter(c => !c.classList.contains('hidden')).length;
    countEl.textContent = visible + ' project' + (visible !== 1 ? 's' : '');
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle button active states
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter the grid items
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
      });
      
      updateCount();
    });
  });

  updateCount();
}

// Start loading process
loadProjects();