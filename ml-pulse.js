import { elapsedChart } from './modules/chart/elapsed-chart.js';
import { scatterChart } from './modules/chart/scatter-chart.js';
import { occurenceChart } from './modules/chart/occurence-chart.js';

const file_reader = new Worker('workers/io/file-reader.js');
const elapsed_regex = /[^\d]*([\d]*M)?([\d\.]*)S/;

const sections = {
  occurence: document.getElementById('chart-occurences'),
  misses: document.getElementById('chart-misses'),
  elapsed: document.getElementById('chart-elapsed')
}

let totals = [];
let charts = {}; 
let filtered = {};
let occurences = {};
let incoming_files = 0;
let treeMisses = [];

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

  charts.misses = scatterChart(treeMisses, sections.misses);


}

file_reader.onmessage = (e) => {
  totals = totals.concat(e.data);
  incoming_files--;
  if (!incoming_files) { 
    // pre-filter
    occurences = totals.reduce( (acc, o) => (acc[o.url] = (acc[o.url] || 0)+1, acc), {} );
    filtered = {};
    treeMisses = [];
    Object.keys(occurences).forEach(key => {
      filtered[key] = totals.filter(line => line.url === key);
      treeMisses.push({ name: key, data: filtered[key].filter(line => line.expandedTreeCacheMisses > line.expandedTreeCacheHits).map(line => [ line.time, line.expandedTreeCacheMisses ]) });
    });
    reloadDashboard();
  }
}

file_reader.onerror = (e) => {
  console.log('file read error', e);
}

const file_inp = document.querySelector('input[name=log_file_path]');
let files = [];

const addLogFiles = () => {
  console.log('read log file', files);
  if (files && files.length) {
    incoming_files += files.length;
    file_reader.postMessage(files);
  }

  Apex.colors = ['#45489b', '#4e51b0', '#676abb', '#8083c6', '#9a9cd2']

  return false;
}

const inpChange = () => {
  files = files.concat(file_inp.files);
}

const dropArea = document.querySelector('.drop_area');
dropArea.addEventListener('drop', handleDrop, false);
file_inp.addEventListener('change',inpChange, false);
dropArea.addEventListener('submit', addLogFiles, false);

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  let dt = e.dataTransfer
  files = files.concat(dt.files);
}