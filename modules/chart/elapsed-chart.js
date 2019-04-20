export function elapsedChart(data, container, config) {
  console.log('elapsedChart', data);
  var options = {
    chart: {
      type: 'area',
      stacked: false,
      height: 350,
      animations: {
        enabled: false
      },
      zoom: {
        enabled: true,
        type: 'x'
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    },
    dataLabels: {
      enabled: false
    },
    series: [{
      name: config.name,
      data: data
    }],
    title: {
      text: config.title,
      align: 'left'
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          val = parseFloat(val);
          if (val === 0) {
            return 0 + ' seconds';
          }
          if (val < 60) {
            return val.toFixed(1) + ' seconds';
          }
          return parseInt(val/60) + ' minutes';
        },
      },
      title: {
        text: 'Seconds'
      },
    },
    xaxis: {
      type: 'datetime'
    },

    tooltip: {
      shared: false,
      y: {
        formatter: function (val) {
          return parseFloat(val/60).toFixed(4) + ' minutes';
        }
      }
    }
  }

  let chart = new ApexCharts(
    container,
    options
  );

  chart.render();

  return chart;

}