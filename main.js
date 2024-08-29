const windowWidth = $(window).width();
const windowHeight = $(window).height();

$(window).resize(function() {
    if (
        windowWidth != $(window).width() ||
        windowHeight != $(window).height()
    ) {
        location.reload();
        return;
    }
});

const width = windowWidth - 200;
const height = windowHeight - 200;

const margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
};
const radius = Math.min(width, height) / 2;

const svg = d3.select('#chart').append('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .append('g')
    .attr('transform', `translate(${(width-margin.left) / 2},${(height-margin.top) / 2-10})`);

const categories = ['Judo', 'Table Tennis', 'Athletics', 'Power Lifting', 'Shooting', 'Archery'];

const allYears = [1992, 1996, 2000, 2004, 2008, 2012, 2016, 2020];

const medalColorScale = d3
    .scaleOrdinal()
    .domain(["Gold", "Silver", "Bronze"])
    .range(["#dfc27d", "#bababa", "#a6611a"]);

const medalBgScale = d3
    .scaleOrdinal()
    .domain(["Gold", "Silver", "Bronze"])
    .range(["#fbf9f3", "#f8f8f8", "#f5efe9"]);


const xScale = d3.scaleBand()
    .domain(allYears)
    .range([0, width - margin.left - margin.right])
    .padding(0.1);

const yScale = d3.scaleBand()
    .domain(categories)
    .range([height - margin.top - margin.bottom, 0])
    .padding(0.1);


// Create an angle scale to map months (0-11) to angles (0-2π)
const angleScale = d3.scaleLinear()
    .domain([1992, 2020])
    .range([0.1 * Math.PI, 1.9 * Math.PI]);

// Create a radius scale based on the data-index
const radiusScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.dataIndex)])
    .range([30, height / 2]); // Adjust range according to your chart size

// Line generator function
const lineGenerator = d3.lineRadial()
    .angle(d => angleScale(d.year))
    .radius(d => radiusScale(d.dataIndex))
    .curve(d3.curveLinear);

// Group the data by dataIndex
const dataGroupedByIndex = d3.group(data, d => d.dataIndex);

// Create an SVG group for each dataIndex group
const categoriesGroup = svg.selectAll('.category')
    .data(dataGroupedByIndex)
    .join('g')
    .attr('class', 'category');

// For each dataIndex group, create a separate radial line
categoriesGroup.append('path')
    .attr('class', 'radial-line')
    .attr('d', ([dataIndex, groupData]) => lineGenerator(groupData))
    .attr('fill', 'none')
    .attr('stroke', '#d9d9d9')
    .attr('stroke-width', 7);

// Append circles to each point within each dataIndex group
categoriesGroup.selectAll('circle')
    .data(([dataIndex, groupData]) => {
        console.log(groupData)
        return groupData.filter(d => d.Medal != "")
    })
    .join('circle')
    // .attr('cx', d => Math.cos(angleScale(d.year) - Math.PI / 2) * radiusScale(d.dataIndex))
    // .attr('cy', d => Math.sin(angleScale(d.year) - Math.PI / 2) * radiusScale(d.dataIndex))
    .attr('r', d => 10)
    .attr('fill', d => medalColorScale(d.Medal));

const axes = svg.selectAll('.axis')
    .data(allYears)
    .join('line')
    .attr('class', 'axis')
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', d => Math.cos(angleScale(d) - Math.PI / 2) * radius)
    .attr('y2', d => Math.sin(angleScale(d) - Math.PI / 2) * radius)
    .attr('stroke', 'gray')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,5')

const labels = svg.selectAll('.year-label')
    .data(allYears)
    .join('text')
    .attr('class', 'year-label')
    .attr('x', d => Math.cos(angleScale(d) - Math.PI / 2) * (radius + 10))
    .attr('y', d => Math.sin(angleScale(d) - Math.PI / 2) * (radius + 10))
    .attr('text-anchor', 'middle')
    .attr('alignment-baseline', 'middle')
    .text(d => d)
    .attr('font-size', '12px');

// Add images at the start of each line
const categoryImages = svg.selectAll('.category-image')
    .data(categories)
    .join('image')
    .attr('class', 'category-image')
    .attr('xlink:href', d => `./img/${d}.png`)
    .attr('width', 40)
    .attr('height', 40)
    .attr('x', (d, i) => Math.cos(angleScale(1990.4) - Math.PI / 2) * radiusScale(i + 1)) // Position to the left
    .attr('y', (d, i) => Math.sin(angleScale(1990.4) - Math.PI / 2) * radiusScale(i + 1)) // Center image on the line
    .attr('transform', d => `translate(-15,-15)`);


const simulation = d3.forceSimulation(data)
    .force('x', d3.forceX().x(d => Math.cos(angleScale(d.year) - Math.PI / 2) * radiusScale(d.dataIndex)))
    .force('y', d3.forceY().y(d => Math.sin(angleScale(d.year) - Math.PI / 2) * radiusScale(d.dataIndex)))
    .force('collision', d3.forceCollide().radius(11))
    .on('tick', function() {
        categoriesGroup.selectAll('circle')
            .attr('cx', function(d) {
                return d.x;
            })
            .attr('cy', function(d) {
                return d.y;
            })
    })


setTimeout(function() {
    simulation.stop()
}, 500);

function unwrapLines() {
    categoriesGroup.selectAll('path')
        .transition()
        .duration(2000)
        .attr('transform', `translate(${-width / 2+margin.left},${-height / 3})`)
        .attrTween('d', function([dataIndex, groupData]) {
            const radialPath = d3.lineRadial()
                .angle(d => angleScale(d.year))
                .radius(d => radiusScale(d.dataIndex))
                .curve(d3.curveLinear)(groupData);

            const linearPath = d3.line()
                .x(d => xScale(d.year))
                .y(d => radiusScale(d.dataIndex))
                .curve(d3.curveLinear)(groupData);

            return d3.interpolate(radialPath, linearPath);
        });

    categoriesGroup.selectAll('circle')
        .transition()
        .duration(2000)
        .attr('transform', `translate(${-width / 2+margin.left},${-height / 3})`)
        .attr('cx', d => xScale(d.year))
        .attr('cy', d => radiusScale(d.dataIndex))
        .on("end", function() {
            simulation = d3.forceSimulation(data)
                .force('x', d3.forceX().x(d => xScale(d.year)))
                .force('y', d3.forceY().y(d => radiusScale(d.dataIndex)))
                .force('collision', d3.forceCollide().radius(11))
                .on('tick', function() {
                    categoriesGroup.selectAll('circle')
                        .attr('cx', function(d) {
                            return d.x;
                        })
                        .attr('cy', function(d) {
                            return d.y;
                        })
                })
        })

    axes.transition()
        .duration(2000)
        .attr('x1', d => xScale(d) - width / 2 + margin.left)
        .attr('y1', radiusScale(1) - height / 3)
        .attr('x2', d => xScale(d) - width / 2 + margin.left)
        .attr('y2', radiusScale(6) - height / 3);

    labels.transition()
        .duration(2000)
        .attr('x', d => xScale(d) - width / 2 + margin.left)
        .attr('y', radiusScale(6) - height / 3 + 20)

    categoryImages.transition()
        .duration(2000)
        .attr('x', (d, i) => xScale(1992) - width / 2) // Position at the start of each line
        .attr('y', (d, i) => radiusScale(i + 1) - height / 3) // Adjust y position


}

d3.select('#unwrap-button').on('click', unwrapLines); // Trigger the unwrap on button click
