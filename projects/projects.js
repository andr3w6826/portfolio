import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedIndex = -1;  // currently highlighted slice

const projects          = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const titleElement      = document.querySelector('.projects-title');
const svg               = d3.select('#projects-pie-plot');
const legendList        = d3.select('.legend');
const colors            = d3.scaleOrdinal(d3.schemeTableau10);

renderProjects(projects, projectsContainer, 'h2');
titleElement.textContent = `${projects.length} Projects`;


function updateSelection() {
  svg.selectAll('path')
     .classed('selected', (_, i) => i === selectedIndex);

  legendList.selectAll('li')
            .classed('selected', (_, i) => i === selectedIndex);
}

 
function renderPieChart(projectsGiven) {

  const rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  const sliceGen = d3.pie().value(d => d.value);
  const arcData  = sliceGen(data);
  const arcGen   = d3.arc().innerRadius(0).outerRadius(50);

  svg.selectAll('path').remove();
  legendList.selectAll('li').remove();

    arcData.forEach((d, i) => {
    svg.append('path')
       .attr('d', arcGen(d))
       .attr('fill', colors(i))
       .style('cursor', 'pointer')
       .on('click', () => {
         // toggle selection
         selectedIndex = selectedIndex === i ? -1 : i;
         updateSelection();
         if (selectedIndex === -1) {
           renderProjects(projects, projectsContainer, 'h2');
         } else {
           const selectedYear = data[selectedIndex].label;
           const filtered    = projects.filter(p => p.year === selectedYear);
           renderProjects(filtered, projectsContainer, 'h2');
         }
       });
  });


  data.forEach((d, i) => {
    legendList.append('li')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedIndex = (selectedIndex === i ? -1 : i);
        updateSelection();
      });
  });

  updateSelection();
}

renderPieChart(projects);

let query = '';
const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', event => {
  query = event.target.value.toLowerCase();
  const filtered = projects.filter(p =>
    p.title.toLowerCase().includes(query)
  );
  renderProjects(filtered, projectsContainer, 'h2');
  renderPieChart(filtered);
});
