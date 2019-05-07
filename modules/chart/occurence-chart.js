export function occurenceChart(data, container, config) {

  var options = {
    chart: {
        width: '33%',
        height: 350,
        type: 'pie',
        events: config.events
    },
    labels: Object.keys(data),
    theme: {
      monochrome: {
          enabled: true,
          color: '#45489b'
      }
    },
    title: {
      text: 'Total Occurences',
      style: {
        fontSize: '18px'
      }
    },
    tooltip: {
      shared: false,
      y: {
        formatter: function (val) {
          return parseInt(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
      }
    },
    series: Object.values(data),
    responsive: [{
        breakpoint: 480,
        options: {
            chart: {
                width: 200
            },
            legend: {
                position: 'bottom'
            }
        }
      }]
  }

  var chart = new ApexCharts(
      container,
      options
  );

  chart.render();

  return chart;

}