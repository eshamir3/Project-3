import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';




// global scope variables
let scaleColor = d3.scaleLinear();
let xScale = d3.scaleTime();
let activeMouse = [0,0];

// Functions


/*
 * Loads mouse data and aggigates to get one "Average Day"
 * for all mice in the csv file
 * @param {String} csvPath - The path to the data
 * @returns {Array} The averaged data value for 24 hours of minutes
 */
async function loadData(csvPath, startDate) {
  const startTimestamp = new Date('2025-01-01T00:00:00');

  const data = await d3.csv(csvPath);
  // Array to store averaged data for each minute of the day
  const minuteAverages = Array(1440).fill(0).map(() => ({ sum: 0, count: 0 }));

  // Iterate through rows
  data.forEach((row, rowIndex) => {
    // timestamp for the current row
    const timestamp = new Date(startTimestamp.getTime() + rowIndex * 60000); // 1-minute increments
    const minuteOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();

    // Iterate through all mouse columns (keys) in the row
    const mouseVals = Object.keys(row).map(mouseKey =>
      parseFloat(row[mouseKey])
    );

    const sampMean = d3.mean(mouseVals);

    minuteAverages[minuteOfDay].sum += sampMean;
    minuteAverages[minuteOfDay].count += 1;
    minuteAverages[minuteOfDay].timeStp = timestamp;

  });

  // Compute the averages for each minute
  const averagedData = minuteAverages.map((minute, index) => ({
    minuteOfDay: index,
    average: minute.count > 0 ? minute.sum / minute.count : 0,
    time: minute.timeStp
  }));
  return averagedData;
}


/*
 * Function to render the circular plot
 * @param {Array} data - The data to use. Should
 * have been loaded with the loadData function
 * to ensure correct formating
 */
function renderCirclePlot(data, elemId) {

  // plot sizeing
  const width = 500;
  const height = 500;
  const innerRadius = 150;
  const outerRadius = 170;

  // create the svg file
  const svg = d3.select(elemId)
    .append('svg')
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Build the axis for the plot
  xScale = d3.scaleTime()
    .domain([new Date(d3.min(data, (d) => d.time)), new Date(d3.max(data, (d) => d.time))])
    .range([0, 2 * Math.PI]);



  scaleColor = d3.scaleLinear()
    .domain([d3.min(data, d => d.average), d3.max(data, d => d.average)])
    .range(["blue", "red"]);


  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(0)
    .endAngle(2 * Math.PI);


  // data drawing
  svg.append('path')
    .attr("d", arc)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

  svg.selectAll(".datapoint-line")
    .data(data)
    .enter()
    .append("line")
    .attr("class", "datapoint-line")
    .attr("x1", d => Math.cos(xScale(d.time) - Math.PI / 2) * innerRadius)
    .attr("y1", d => Math.sin(xScale(d.time) - Math.PI / 2) * innerRadius)
    .attr("x2", d => Math.cos(xScale(d.time) - Math.PI / 2) * outerRadius)
    .attr("y2", d => Math.sin(xScale(d.time) - Math.PI / 2) * outerRadius)
    .attr("stroke", d => scaleColor(d.average))
    .attr("stroke-width", 2);


  svg.selectAll(".time-label")
    .data(data.filter((_, i) => i % 60 === 0)) // Label every hour
    .enter()
    .append("text")
    .attr("class", "time-label")
    .attr("x", d => Math.cos(xScale(d.time) - Math.PI / 2) * (outerRadius + 20))
    .attr("y", d => Math.sin(xScale(d.time) - Math.PI / 2) * (outerRadius + 20))
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-size", "10px")
    .text(d => d3.timeFormat("%H:%M")(d.time))
    .on('mouseover', (event, point) => {
      // TODO add tooltip
      // just call a tooltip renderer
      // and use that, which can render
      // a tooltip anywhere with the given
      // data...
      // but should also be able to render
      // tooltip on the corralary plot...
    })
    .on('mouseleave', (event, point) =>{

    });
}

fuction renderTooltit(event, data) {
  const temp = data.average;
  const time = data.time;
}


const femTemp = await loadData('data/mouseData_femTemp.csv');
renderCirclePlot(femTemp, '#femTempPlot');
const maleTemp = await loadData('data/mouseData_maleTemp.csv')
renderCirclePlot(maleTemp, '#maletempPlot')
