import { fetchJSON, renderProjects, fetchGitHubData} from './global.js';

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('andr3w6826');

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
      <h2>My Github Stats</h2>
      <div class="stats-grid">
        <div>
          <dt>Public Repos</dt>
          <dd>${githubData.public_repos}</dd>
        </div>
        <div>
          <dt>Followers</dt>
          <dd>${githubData.followers}</dd>
        </div>
        <div>
          <dt>Following</dt>
          <dd>${githubData.following}</dd>
        </div>
      </div>
    `;
  }
  