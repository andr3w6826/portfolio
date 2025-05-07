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
    
    // 1. A helper to map an hour → time‑of‑day label
    function timeOfDayLabel(hour) {
        if (hour >= 6  && hour < 12) return "Morning";
        if (hour >= 12 && hour < 17) return "Afternoon";
        if (hour >= 17 && hour < 21) return "Evening";
        return "Night";
    }
    
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

  let data = await loadData();
  let commits = processCommits(data);
  console.log(data);
  renderCommitInfo(data, commits);