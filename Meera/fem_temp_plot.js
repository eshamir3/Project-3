import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const svg = d3.select("#female_temp_line");
const margin = { top: 20, right: 100, bottom: 50, left: 50 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

const estrusStart = 2880;
const estrusPeriod = 5760;
const estrusDuration = 1440;

d3.csv("./data/fem_mouse_temp.csv").then(data => {
  const time = d3.range(data.length); // 0 to 20159
  const mice = data.columns;
  console.log('data loaded')

  const parsed = time.map((t, i) => {
    let row = { time: +t };
    mice.forEach(id => {
      row[id] = +data[i][id];
    });
    return row;
  });

  const x = d3.scaleLinear().domain([0, 20160]).range([0, width]);
  const y = d3.scaleLinear()
    .domain([d3.min(parsed, d => d3.min(mice, id => d[id])), d3.max(parsed, d => d3.max(mice, id => d[id]))])
    .nice()
    .range([height, 0]);

  // Axes
  g.append("g").attr("transform", `translate(0,${height})`).call(
    d3.axisBottom(x).ticks(14).tickFormat(d => `Day ${Math.floor(d / 1440)}`)
  );
  g.append("g").call(d3.axisLeft(y).tickFormat(d => d + "°C"));

  svg.append("text")
  .attr("text-anchor", "middle")
  .attr("x", margin.left + width / 2)
  .attr("y", height + margin.top + margin.bottom - 5)
  .text("Time (Days)");

// Y Axis Label
svg.append("text")
  .attr("text-anchor", "middle")
  .attr("transform", `rotate(-90)`)
  .attr("x", -(margin.top + height / 2))
  .attr("y", 12)
  .text("Body Temperature (°C)");

  // Estrus shading
  for (let t = estrusStart; t < 20160; t += estrusPeriod) {
    g.append("rect")
      .attr("class", "estrus-band")
      .attr("x", x(t))
      .attr("width", x(t + estrusDuration) - x(t))
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "pink")
      .attr("opacity", 0.3);
  }

  // Line generator
  const line = d3.line()
    .x(d => x(d.time))
    .y(d => y(d.value));

  // Draw lines
  mice.forEach((id, index) => {
    const mouseData = parsed.map(d => ({ time: d.time, value: d[id] }));
    g.append("path")
      .datum(mouseData)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", d3.schemeTableau10[index % 10])
      .attr("stroke-width", 1.5)
      .attr("d", line);
  });
});


const svg2 = d3.select("#comp_plot");
const margin2 = { top: 20, right: 100, bottom: 50, left: 50 };
const width2 = +svg2.attr("width") - margin2.left - margin2.right;
const height2 = +svg2.attr("height") - margin2.top - margin2.bottom;
const g2 = svg2.append("g").attr("transform", `translate(${margin2.left},${margin2.top})`);

Promise.all([
  d3.csv("./data/fem_mouse_act.csv"),
  d3.csv("./data/male_mouse_act.csv")
]).then(([femData, maleData]) => {
  const time = d3.range(femData.length);

  function computeAverages(data) {
    const ids = data.columns;
    return time.map((t, i) => {
      const sum = d3.sum(ids, id => +data[i][id]);
      return { time: t, avg: sum / ids.length };
    });
  }

  const femAvg = computeAverages(femData);
  const maleAvg = computeAverages(maleData);

  const x = d3.scaleLinear().domain([0, 20160]).range([0, width2]);
  const y = d3.scaleLinear()
    .domain([0, d3.max([...femAvg, ...maleAvg], d => d.avg)])
    .nice()
    .range([height2, 0]);

  // Axes
  g2.append("g")
    .attr("transform", `translate(0,${height2})`)
    .call(d3.axisBottom(x).ticks(14).tickFormat(d => `Day ${Math.floor(d / 1440)}`));
  g2.append("g")
    .call(d3.axisLeft(y).tickFormat(d => d.toFixed(1)));

  // X Axis Label
  svg2.append("text")
    .attr("text-anchor", "middle")
    .attr("x", margin2.left + width2 / 2)
    .attr("y", margin2.top + height2 + 40)
    .text("Time (Days)");

  // Y Axis Label
  svg2.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `rotate(-90)`)
    .attr("x", -(margin2.top + height2 / 2))
    .attr("y", 15)
    .text("Activity Level (AU)");

  // Estrus shading
  for (let t = estrusStart; t < 20160; t += estrusPeriod) {
    g2.append("rect")
      .attr("x", x(t))
      .attr("width", x(t + estrusDuration) - x(t))
      .attr("y", 0)
      .attr("height", height2)
      .attr("fill", "pink")
      .attr("opacity", 0.3);
  }

  // Line generator
  const line = d3.line()
    .x(d => x(d.time))
    .y(d => y(d.avg));

  g2.append("path")
    .datum(femAvg)
    .attr("fill", "none")
    .attr("stroke", "deeppink")
    .attr("stroke-width", 2)
    .attr("d", line);

  g2.append("path")
    .datum(maleAvg)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

  // Legend
  const legend = svg2.append("g")
    .attr("transform", `translate(${margin2.left + width2 + 10}, ${margin2.top})`);

  legend.append("circle").attr("r", 5).attr("fill", "deeppink").attr("cy", 0);
  legend.append("text").text("Female Avg").attr("x", 10).attr("y", 5);

  legend.append("circle").attr("r", 5).attr("fill", "steelblue").attr("cy", 20);
  legend.append("text").text("Male Avg").attr("x", 10).attr("y", 25);
});