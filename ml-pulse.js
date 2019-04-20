import { elapsedChart } from './modules/chart/elapsed-chart.js';
import { brushChart } from './modules/chart/elapsed_brush.js';
import { occurenceChart } from './modules/chart/occurence-chart.js';
import { downsamplePlugin } from './modules/chart/downsample.js';

const plugins = {
  downsample: downsamplePlugin()
}

const file_reader = new Worker('workers/io/file-reader.js');
const elapsed_regex = /[^\d]*([\d]*M)?([\d\.]*)S/;

const sections = {
  occurence: document.getElementById('chart-occurences'),
  elapsed: document.getElementById('chart-elapsed')
}

let totals = [];
let charts = {}; 
let filtered = {};
let occurences = {};
let incoming_files = 0;

function clearDashboard() {
  Options.values(sections).forEach(section => { section.innerHTML = '' } );
}

function selectUrl(url) { 
  sections.elapsed.innerHTML = '';
  let elapsed = filtered[url].map(line => {
    let time = line.elapsedTime;
    let seconds = 0;
    let matches = elapsed_regex.exec(time);
    if (matches[1]) {
      seconds += parseInt(matches[1]) * 60;
    }
    seconds += parseFloat(matches[2]);
    return [
      line.time,
      seconds
    ];
  });
  console.log('elapsed', elapsed.length, elapsed[0]);
  charts.elapsed = elapsedChart(elapsed, sections.elapsed, { name: url, title: url });
}

function reloadDashboard() {
  console.log('reload dashboard', filtered);

  charts.occurences = occurenceChart(occurences, sections.occurence, {
    events: {
      dataPointSelection: (event, context, data) => {
        console.log('dataPointSelection', data.w.config.labels, data.dataPointIndex);
        let url = data.w.config.labels[data.dataPointIndex];
        selectUrl(url);
      }
    }
  });
}

file_reader.onmessage = (e) => {
  totals = totals.concat(e.data);
  incoming_files--;
  if (!incoming_files) { 
    // pre-filter
    occurences = totals.reduce( (acc, o) => (acc[o.url] = (acc[o.url] || 0)+1, acc), {} );
    filtered = {};
    Object.keys(occurences).forEach(key => {
      filtered[key] = totals.filter(line => line.url === key);
    });
    reloadDashboard();
  }
}

file_reader.onerror = (e) => {
  console.log('file read error', e);
}

window.addLogFile = () => {
  let files = document.querySelector('input[name=log_file_path]').files;
  console.log('read log file', files);
  if (files && files.length) {
    incoming_files += files.length;
    file_reader.postMessage(files);
  }

  Apex.colors = ['#45489b', '#4e51b0', '#676abb', '#8083c6', '#9a9cd2']

  return false;
}