var reduceDataPointsPlugin = {
  beforeUpdate: function (chart, options) {
    filterData(chart);
  }
};

function filterData(chart) {
  var maxRenderedPointsX = 800;
  var datasets = chart.data.datasets;
  if (!chart.data.origDatasetsData) {
    chart.data.origDatasetsData = [];
    for (var i in datasets) {
      chart.data.origDatasetsData.push(datasets[i].data);
    }
  }
  var originalDatasetsData = chart.data.origDatasetsData;
  var chartOptions = chart.options.scales.xAxes[0];
  var startX = chartOptions.min ? chartOptions.min : chartOptions.ticks.min;
  var endX = chartOptions.max ? chartOptions.max : chartOptions.ticks.max;
  console.log('downsampling data', chart.options.scales, startX, endX);

  if (startX && typeof startX === 'object')
    startX = startX._d ? startX._d.getTime() : startX.getTime();
  if (endX && typeof endX === 'object')
    endX = endX._d ? endX._d.getTime() : endX.getTime();

  console.log('downsampling data', startX, endX);

  for (var i = 0; i < originalDatasetsData.length; i++) {
    var originalData = originalDatasetsData[i];

    if (!originalData.length)
      continue;

    var firstElement = {index: 0, time: null};
    var lastElement = {index: originalData.length - 1, time: null};

    for (var j = 0; j < originalData.length; j++) {
      var time = originalData[j].x;
      if (time >= startX && (firstElement.time === null || time < firstElement.time)) {
        firstElement.index = j;
        firstElement.time = time;
      }
      if (time <= endX && (lastElement.time === null || time > lastElement.time)) {
        lastElement.index = j;
        lastElement.time = time;
      }
    }
    var startIndex = firstElement.index <= lastElement.index ? firstElement.index : lastElement.index;
    var endIndex = firstElement.index >= lastElement.index ? firstElement.index : lastElement.index;
    datasets[i].data = reduce(originalData.slice(startIndex, endIndex + 1), maxRenderedPointsX);
  }
}

// returns a reduced version of the data array, averaging x and y values
function reduce(data, maxCount) {
  if (data.length <= maxCount)
    return data;
  var blockSize = data.length / maxCount;
  var reduced = [];
  for (var i = 0; i < data.length;) {
    var chunk = data.slice(i, (i += blockSize) + 1);
    reduced.push(average(chunk));
  }
  return reduced;
}

function average(chunk) {
  var x = 0;
  var y = 0;
  for (var i = 0; i < chunk.length; i++) {
    x += chunk[i].x;
    y += chunk[i].y;
  }
  return {x: Math.round(x / chunk.length), y: y / chunk.length};
}

export function downsamplePlugin() {
  return reduceDataPointsPlugin;
}