self.addEventListener('message', function(e) {
  const files = e.data;

  const linebreak = /\r?\n|\r/;

  // Read each file synchronously as a string and
  // stash it in a global array to return to the main app.
  [].forEach.call(files, function(file) {
    console.log('reading ', file.name);
    let reader = new FileReaderSync();
    let contents = reader.readAsText(file);
    let parsed = {};
    // split contents by line
    let lines = contents.split(linebreak);
    let json = [];
    lines.forEach(line => {
      try {
        parsed = JSON.parse(line);
        parsed.file = file.name;
        json.push(parsed);
      } catch(ex) {
        console.log('could not parse log line', ex);
      }
    })
    postMessage(json)
  });

}, false);