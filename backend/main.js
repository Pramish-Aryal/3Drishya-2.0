const express = require('express');
var cors = require('cors');

const app = express();
app.use(cors())
const port = 3000

const fs = require('node:fs');

function read_file(filename) {
    try {
      const data = fs.readFileSync(filename, 'utf8');
      console.log(data);
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


app.get('/getFile', (req, res) => {
  filename = req.query.filename
  console.log("Getting file: " + filename)
  res.send(read_file(filename));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})