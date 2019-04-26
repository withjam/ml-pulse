export function scatterChart(data, container, config) {

  console.log('scatter', data);
  const options = {
    chart: {
      height: 350,
      type: 'scatter',
      zoom: {
        type: 'xy'
      }
    },
    series: data,
    dataLabels: {
      enabled: false
    },
    grid: {
      xaxis: {
        showLines: true
      },
      yaxis: {
        showLines: true
      },
    }
  }

  var chart = new ApexCharts(
    container,
    options
  );

  // chart.render();

  return chart;
}