const express = require('express');
var cors = require('cors');

const app = express();
app.use(express.json())
app.use(cors())
const port = 3000

const fs = require('node:fs');

function read_file(filename) {
    try {
      const data = fs.readFileSync(filename, 'utf8');
      return data;
    } catch (err) {
      console.error(err);
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
  let filename = req.query.filename
  let file = read_file(filename);
  let fileJSON = JSON.parse(file);
  res.json(fileJSON);
})

app.post('/postFile', (req, res) => {
  try {
    const receivedData = req.body;

    
    write_file("./a.json", JSON.stringify(receivedData));

    // Process the received JSON data as needed
    // Example: Save to a database, perform calculations, etc.

    res.json({ success: true, message: 'JSON data received successfully' });
  } catch (error) {
    console.error('Error while processing JSON data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})