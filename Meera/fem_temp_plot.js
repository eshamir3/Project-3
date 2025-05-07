import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const svg = d3.select("svg");
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