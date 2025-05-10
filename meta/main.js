import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


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

    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    // axis scales
    const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
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
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);
    const dots = svg.append('g').attr('class', 'dots');

    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('class', d => timeOfDayLabel(d.datetime.getHours()))
    .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', () => {
        updateTooltipVisibility(false);
      });
    
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

  let data = await loadData();
  let commits = processCommits(data);
  renderCommitInfo(data, commits);

  renderScatterPlot(data, commits);