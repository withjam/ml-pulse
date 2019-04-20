export function brushChart(data, container, options) {
  container.innerHTML = '<canvas width="400" height="400"></canvas>';
  let ctx = container.querySelector('canvas').getContext('2d');
  

  let config = {
    type: 'line',
    data: {
      labels: data.map(line => line[0]),
      datasets: [{
        label: 'Elapsed Time',
        data: data.map(line => line[1]),
        borderWidth: 1
      }]
    },
    plugins: options.plugins,
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          type: 'time',
          min: data[0][0],
          max: data[data.length-1][0]
        }],
        plugins: {
          zoom: {
            enabled: true
          },
          pan: {
            enabled: true
          }
        }
      },
      downsample: {
        enabled: true,
        threshold: 200, 

        auto: false, // don't re-downsample the data every move
        onInit: true, // but do resample it when we init the chart (this is default)

        preferOriginalData: true, // use our original data when downscaling so we can downscale less, if we need to.
        restoreOriginalData: false, // if auto is false and this is true, original data will be restored on pan/zoom - that isn't what we want.
      }
    }
  } 

  new Chart(ctx, config);
}