
const margin = { top: 30, right: 30, bottom: 50, left: 60 },
      width = 1000 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#chart")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

d3.csv("temperature_long.csv").then(data => {
  data.forEach(d => {
    d.Minute = +d.Minute;
    d.Temperature = +d.Temperature;
    d.Day = +d.Day;
    d.MouseID = d.MouseID.trim().toLowerCase();
  });

  const mouseIDs = Array.from(new Set(data.map(d => d.MouseID))).sort();
  const dropdown = d3.select("#mouseDropdown");

  dropdown.selectAll("option")
    .data(mouseIDs)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d.toUpperCase());

  const xScale = d3.scaleLinear().domain([0, 20160]).range([0, width]);
  const yScale = d3.scaleLinear().domain(d3.extent(data, d => d.Temperature)).range([height, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(xScale)
        .tickValues(d3.range(0, 20161, 1440))
        .tickFormat(d => `Day ${Math.floor(d / 1440) + 1}`)
    );

  svg.append("g").call(d3.axisLeft(yScale));

  const line = d3.line()
    .x(d => xScale(d.Minute))
    .y(d => yScale(d.Temperature));

  const path = svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5);

  const updateChart = (mouseID) => {
    const filtered = data.filter(d => d.MouseID === mouseID);
    path.datum(filtered).attr("d", line);

    svg.selectAll(".dot").remove();
    svg.selectAll(".dot")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.Minute))
      .attr("cy", d => yScale(d.Temperature))
      .attr("r", 2)
      .attr("fill", "tomato")
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Minute: ${d.Minute}<br>Temp: ${d.Temperature}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  };

  updateChart(mouseIDs[0]);

  dropdown.on("change", function () {
    updateChart(this.value);
  });
});
