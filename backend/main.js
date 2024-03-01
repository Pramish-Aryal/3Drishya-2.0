const express = require('express');
var cors = require('cors');

const app = express();
app.use(express.json())
app.use(cors())
const port = 3000

const fs = require('node:fs');
const path = require('path');

const directoryPath = './data/scenes/';

function read_file(filename) {
  try {
    const data = fs.readFileSync(filename, 'utf8');
    return data;
  } catch (err) {
    console.error(`Could not read the given file: ${filename}\nError: ${err}`);
    return null;
  }
}

function write_file(filename, content) {
  try {
    fs.writeFileSync(filename, content);
  } catch (err) {
    console.error(err);
  }
}


app.get('/readFile', (req, res) => {
  let filename = directoryPath + req.query.filename
  let file = read_file(filename);
  if (file) {
    let fileJSON = JSON.parse(file);
    res.json(fileJSON);
  } else {
    res.status(500).json({ success: false, message: 'Could not find the specified file' });
  }
})

app.post('/postFile', (req, res) => {
  try {
    const receivedData = req.body;
    let filename = directoryPath + req.query.filename

    console.log(filename)

    write_file(filename, JSON.stringify(receivedData));

    // Process the received JSON data as needed
    // Example: Save to a database, perform calculations, etc.

    res.json({ success: true, message: 'JSON data received successfully' });
  } catch (error) {
    console.error('Error while processing JSON data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


// Function to get the list of files in a directory
function getFilesInDirectory(directoryPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}


app.get('/queryFiles', (req, res) => {
  // Specify the path to the directory you want to scan

  // Call the function to get the list of files
  getFilesInDirectory(directoryPath)
    .then(files => {
      // Send the list of files as a JSON response
      res.json({ files });
    })
    .catch(err => {
      console.error("Error reading directory:", err);
      // Send an error response if something went wrong
      res.status(500).json({ error: 'Internal Server Error' });
    });
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})