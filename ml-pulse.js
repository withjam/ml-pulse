import { elapsedChart } from './modules/chart/elapsed-chart.js';
import { scatterChart } from './modules/chart/scatter-chart.js';
import { occurenceChart } from './modules/chart/occurence-chart.js';

const file_inp = document.querySelector('input[name=log_file_path]');
const file_reader = new Worker('workers/io/file-reader.js');
const elapsed_regex = /[^\d]*([\d]*M)?([\d\.]*)S/;

// DOM Elements
const uploadModal = document.querySelector('.modal');
const dropArea = document.querySelector('.drop-area');
const upForm = document.querySelector('form[name="add_file"]');
const uploadBtn = document.querySelector('header .add');
const fileSelector = document.querySelector('select[name="files"]');


// Event handlers
dropArea.addEventListener('drop', handleDrop);
dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('dropping')}, false);
dropArea.addEventListener('dragleave', (e) => { e.preventDefault(); dropArea.classList.remove('dropping')}, false);
file_inp.addEventListener('change',inpChange);
upForm.addEventListener('submit', addLogFiles);
uploadBtn.addEventListener('click', showUploadModal);
fileSelector.addEventListener('change', filterSelectedFile);

const sections = {
  occurence: document.getElementById('chart-occurences'),
  misses: document.getElementById('chart-misses'),
  elapsed: document.getElementById('chart-elapsed')
}

let totals = [];
let charts = {}; 
let filtered = {};
let occurences = {};
let logFiles = [];
let incoming_files = 0;
let treeMisses = [];
let uploads = [];
let selectedFile;

function clearDashboard() {
  Object.values(sections).forEach(section => { section.innerHTML = '' } );
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
  charts.elapsed = elapsedChart(elapsed, sections.elapsed, { name: url, title: 'Elapsed Time: '+ url });
}

function reduceOccurences(acc, o) {
  acc[o.url] = (acc[o.url] || 0)+1;
  return acc;
}

function renderDashboard() {
  console.log('render dashboard', filtered);
  clearDashboard();

  const collection = selectedFile ? totals.filter(line => line._from_file === selectedFile) : totals;

  charts.occurences = occurenceChart(collection.reduce(reduceOccurences, {}), sections.occurence, {
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
    occurences = totals.reduce( reduceOccurences, {} );
    filtered = {};
    treeMisses = [];
    Object.keys(occurences).forEach(key => {
      filtered[key] = totals.filter(line => line.url === key);
      treeMisses.push({ name: key, data: filtered[key].filter(line => line.expandedTreeCacheMisses > line.expandedTreeCacheHits).map(line => [ line.time, line.expandedTreeCacheMisses ]) });
    });
    renderDashboard();
  }
}

file_reader.onerror = (e) => {
  console.log('file read error', e);
}

function addLogFiles() {
  console.log('uploading log file', uploads);
  if (uploads && uploads.length) {
    incoming_files += uploads.length;
    file_reader.postMessage(uploads);
  }

  logFiles = logFiles.concat(uploads.map(fileObj => fileObj.name));
  // reset uploads
  uploads = [];
  uploadModal.classList.remove('shown');

  // update the file selection
  selectedFile = null;
  fileSelector.innerHTML = '<option value="*" selected>All files</option>';
  logFiles.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.innerHTML = name;
    fileSelector.appendChild(option);
  })
  
  
  return false;
}

function renderPendingFiles() {
  const ul = document.getElementById('upload-list');
  ul.innerHTML = '';
  uploads.forEach(file => {
    let li = document.createElement('li');
    li.innerHTML = '<i class="fas fa-file"></i> ' + file.name;
    ul.appendChild(li);
  })
}

function inpChange() {
  uploads = uploads.concat(Array.prototype.slice.call(file_inp.files));
  renderPendingFiles();
}

function handleDrop(e) {
  e.preventDefault();
  dropArea.classList.remove('dropping');
  let dt = e.dataTransfer
  uploads = uploads.concat(Array.prototype.slice.call(dt.files));
  renderPendingFiles();
}

function showUploadModal() {
  renderPendingFiles();
  uploadModal.classList.add('shown');
}

function filterSelectedFile() {
  const val = fileSelector.value;
  if (val === '*') {
    selectedFile = null;
  } else {
    selectedFile = val;
    // rerender the charts
  }
  console.log('selectedFile', selectedFile);
  renderDashboard();
}