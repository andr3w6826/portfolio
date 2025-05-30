import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';
let xScale, yScale;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    return data;
  }



  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/andr3w6826/portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', { 
            value: lines, 
            writable: false, 
            enumerable: false, 
            configurable: false, 
        });
  
        return ret;
      });
  }

  // top of main.js
    function timeOfDayLabel(hour) {
        if (hour >= 6  && hour < 12) return "Morning";
        if (hour >= 12 && hour < 17) return "Afternoon";
        if (hour >= 17 && hour < 21) return "Evening";
        return "Night";
    }
  
  function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    dl.append('dt').text('Files');
    dl.append('dd').text(d3.group(data, d => d.file).size);
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

    const files = d3.groups(data, d => d.file); 
    const avgFileLength = d3.mean(files, ([file, rows]) => rows.length);
    dl.append('dt').text('Average file length (lines)');
    dl.append('dd').text(avgFileLength.toFixed(1));
  
    dl.append('dt').text('Longest Line');
    dl.append('dd').text(d3.max(data, d => d.length));
    
    const byBucket = d3.rollup(
        data,
        rows => rows.length,
        d   => timeOfDayLabel(d.datetime.getHours())
    );
    
    let busiest = Array.from(byBucket.entries())
                        .reduce((best, curr) => curr[1] > best[1] ? curr : best);

    dl.append("dt").text("Busiest time of day");
    dl.append("dd").text(busiest[0]);

    const byDate = d3.groups(
        data,
        d => d.datetime.toISOString().slice(0,10)
      );
      const daysWorked = byDate.length;
      dl.append('dt').text('Days worked');
      dl.append('dd').text(daysWorked);

  }

  function renderScatterPlot(data, commits) {

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 20]); // adjust these values based on your experimentation

    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
      };

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    // axis scales
    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    

    // gridlines
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);


    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // y and x axis
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis') // new line to mark the g tag
    .call(d3.axisBottom(xScale));

    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .attr('class', 'y-axis') // just for consistency
    .call(yAxis);

    // ????
    const dots = svg.append('g')
    .attr('class', 'dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
    .selectAll('circle')
    .data(sortedCommits, (d) => d.id)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill-opacity', 0.7) // Add transparency for overlapping dots
    .attr('class', d => timeOfDayLabel(d.datetime.getHours()))
    .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
    });
    svg.call(
        d3.brush()
          .extent([
            [usableArea.left, usableArea.top],
            [usableArea.right, usableArea.bottom]
          ])
          .on('start brush end', brushed)   // ← wire up our handler
      );
      
      // 5.2: raise dots & brush handles above overlay so tooltips work
      svg.selectAll('.dots, .overlay ~ *').raise();
    
  }
    function renderTooltipContent(commit) {
        if (!commit || !commit.id) return;
      
        document.getElementById('commit-link').href        = commit.url;
        document.getElementById('commit-link').textContent = commit.id;
      
        document.getElementById('commit-date').textContent   =
          commit.datetime.toLocaleDateString(undefined, { dateStyle: 'full' });
      
        document.getElementById('commit-time').textContent   =
          commit.datetime.toLocaleTimeString(undefined, { timeStyle: 'short' });
      
        document.getElementById('commit-author').textContent = commit.author;
        document.getElementById('commit-lines').textContent  = commit.totalLines;
    }
      
    function updateTooltipVisibility(isVisible) {
        const tooltip = document.getElementById('commit-tooltip');
        tooltip.hidden = !isVisible;
    }
    function updateTooltipPosition(event) {
        const tooltip = document.getElementById('commit-tooltip');
        tooltip.style.left = `${event.clientX}px`;
        tooltip.style.top = `${event.clientY}px`;
    }
 
    function brushed(event) {
        const selection = event.selection;
    
        d3.selectAll('circle')
          .classed('selected', d => isCommitSelected(selection, d));
      
        renderSelectionCount(selection);
      
        renderLanguageBreakdown(selection);
      }

    function renderSelectionCount(selection) {
        const selectedCommits = selection
          ? commits.filter(d => isCommitSelected(selection, d))
          : [];
      
        const countEl = document.querySelector('#selection-count');
        const n = selectedCommits.length;
        countEl.textContent = n
          ? `${n} commit${n > 1 ? 's' : ''} selected`
          : 'No commits selected';
      
        return selectedCommits;
      }
      
      function renderLanguageBreakdown(selection) {

        const chosen = (selection && renderSelectionCount(selection).length)
          ? renderSelectionCount(selection)
          : commits;
      
        const lines = chosen.flatMap(d => d.lines);
      

        const breakdown = d3.rollup(
          lines,
          v => v.length,
          d => d.type
        );
      
        const dl = document.getElementById('language-breakdown');
        dl.innerHTML = '';
      
        
        if (breakdown.size === 0) return;
      
        const total = lines.length;
        const fmt = d3.format('.1%');
    
        for (const [lang, count] of breakdown) {
          const pct = fmt(count / total);
          dl.innerHTML += `
            <dt>${lang}</dt>
            <dd>${count} lines (${pct})</dd>
          `;
        }
    }
      

      
   // 5.4.b: true if a commit’s (x,y) lies inside the brush bounds
   function isCommitSelected(selection, commit) {
    if (!selection) return false;
    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }
  let data = await loadData();
  let commits = processCommits(data);

  renderCommitInfo(data, commits);
  renderScatterPlot(data, commits);

  // lab 8
  let commitProgress = 100;
  let timeScale = d3
    .scaleTime()
    .domain([
      d3.min(commits, (d) => d.datetime),
      d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);
  let commitMaxTime = timeScale.invert(commitProgress);
  let filteredCommits = commits;
  
  function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    const svg = d3.select('#chart').select('svg');
  
    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));
  
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
  
    const xAxis = d3.axisBottom(xScale);
  
    const dots = svg.select('g.dots');
  
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
      .selectAll('circle')
      .data(sortedCommits, (d) => d.id)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines))
      .attr('class', d => timeOfDayLabel(d.datetime.getHours()))
      .style('fill-opacity', 0.7) 
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
      const xAxisGroup = svg.select('g.x-axis');
      xAxisGroup.selectAll('*').remove();
      xAxisGroup.call(d3.axisBottom(xScale));
  }

  function onTimeSliderChange() {

    commitProgress = +d3.select('#commit-progress').property('value');

    commitMaxTime   = timeScale.invert(commitProgress);

    d3.select('#commit-time')
      .text(
        commitMaxTime.toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      );
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

    // keep stats updating
    const filteredRows = filteredCommits.flatMap(d => d.lines);
    d3.select('#stats').html('');
    renderCommitInfo(filteredRows, filteredCommits);

    // wha
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
    })
    .sort((a, b) => b.lines.length - a.lines.length);

    // ??
    let filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join(
    
      (enter) =>
        enter.append('div').call((div) => {
          div.append('dt').append('code');
          div.append('dd').attr('class','units'); // ???
        }),
    );

    filesContainer.select('dt > code').text((d) => d.name);
    filesContainer.attr('style', (d) => `--color: ${colors(d.name)}`);

    filesContainer
      .select('dd')
      .selectAll('div.line')
      .data(d => d.lines)
      .join('div')
        .attr('class','line')
      
    
    updateScatterPlot(data, filteredCommits);

  }

  d3.select('#commit-progress').on('input', onTimeSliderChange);
  onTimeSliderChange();

  d3.select('#scatter-story')
  .selectAll('.step')
  .data(commits)
  .join('div')
  .attr('class', 'step')
  .html(
    (d, i) => `
		On ${d.datetime.toLocaleString('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    })},
		I made <a href="${d.url}" target="_blank">${
      i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
    }</a>.
		I edited ${d.totalLines} lines across ${
      d3.rollups(
        d.lines,
        (D) => D.length,
        (d) => d.file,
      ).length
    } files.
		Then I looked over all I had made, and I saw that it was very good.
	`,
  );

  function onStepEnter(response) {
    console.log(response.element.__data__.datetime);
  }
  
  const scroller = scrollama();
  // scroller
  //   .setup({
  //     container: '#scrolly-1',
  //     step: '#scrolly-1 .step',
  //   })
  //   .onStepEnter(onStepEnter);

scroller
  .setup({
    container:  '#scrolly-1',           // the outer grid
    graphic:    '#scatter-plot',        // the chart panel
    step:       '#scatter-story .step', // each step to watch
    offset:     0.6,                    // trigger when step hits 60% down
    // debug:   true,                   // uncomment to see markers
  })
  .onStepEnter(({ index }) => {
    // index 0 → first step, 1 → second, etc.
    // pick a slider value (or any other filter) per step:
    const stepValues = [100, 75, 50, 25]; 
    const newVal = stepValues[index] ?? 100;

    // move the slider and redraw
    d3.select('#commit-progress').property('value', newVal);
    onTimeSliderChange();
  });