const margin = { top: 20, right: 20, bottom: 70, left: 70 },
      width = 1000 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select(".tooltip");

d3.csv("mouse_data_hourly_heatmap.csv").then(data => {
  data.forEach(d => {
    d.MouseID = d.MouseID.trim().toLowerCase();
    d.HourOfDay = +d.HourOfDay;
    d.Day = +d.Day;
    d.Activity = +d.Activity;
  });

  const mouseIDs = Array.from(new Set(data.map(d => d.MouseID))).sort();

  const dropdown = d3.select("#mouseSelect");
  dropdown.selectAll("option")
    .data(mouseIDs)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d.toUpperCase());

  const xScale = d3.scaleLinear().domain([0, 23]).range([0, width]);
  const yScale = d3.scaleLinear().domain([1, 14]).range([0, height]);

  function drawHeatmap(mouseID) {
    const filtered = data.filter(d =>
      d.MouseID === mouseID &&
      !isNaN(d.Activity) &&
      !isNaN(d.HourOfDay) &&
      !isNaN(d.Day)
    );

    console.log(`Drawing ${mouseID} with ${filtered.length} rows`);

    const activityExtent = d3.extent(filtered, d => d.Activity);
    const color = d3.scaleSequential(d3.interpolateYlOrRd).domain(activityExtent);

    svg.selectAll("*").remove();

    // X-axis (move below heatmap)
    svg.append("g")
      .attr("transform", `translate(0, ${height + 20})`)
      .call(d3.axisBottom(xScale).ticks(24))
      .append("text")
      .attr("x", width / 2)
      .attr("y", 50)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Hour of Day");

    // Y-axis
    svg.append("g")
      .call(d3.axisLeft(yScale).ticks(14))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -50)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("Day");

    const cellWidth = xScale(1) - xScale(0);
    const cellHeight = yScale(2) - yScale(1);

    svg.selectAll("rect")
      .data(filtered)
      .enter()
      .append("rect")
      .attr("x", d => xScale(d.HourOfDay))
      .attr("y", d => yScale(d.Day))
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", d => color(d.Activity))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip.html(`Mouse: ${d.MouseID.toUpperCase()}<br>Day: ${d.Day}<br>Hour: ${d.HourOfDay}<br>Activity: ${d.Activity}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      });
  }

  drawHeatmap(mouseIDs[0]);

  dropdown.on("change", function () {
    drawHeatmap(this.value);
  });
});
