const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
var cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(express.json())
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));


const path = require('path');


// Set up storage options for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


const corsOptions = {
    origin: ['http://127.0.0.1:5173', 'http://localhost:5173'],
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
const port = 3000

// const fs = require('node:fs');
// const path = require('path');

const directoryPath = './data/scenes/';
const imgDirPath = './data/splashImages/';


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




const imagesDir = path.join(__dirname, 'data', 'splashImages');
fs.mkdirSync(imagesDir, { recursive: true });

app.post('/save-image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filename = req.file.originalname;
    const outputPath = path.join(__dirname, 'data', 'splashImages', filename);

    // Use sharp to resize and save the image, overwriting any existing file
    sharp(req.file.buffer)
        .resize(450, 300, {
            fit: sharp.fit.inside,
            withoutEnlargement: true
        })
        .toFile(outputPath)
        .then(() => {
            console.log('Image saved (or overwritten if it existed):', filename);
            res.send('Image saved successfully.');
        })
        .catch(err => {
            console.error('Error processing image:', err);
            res.status(500).send('Error saving image.');
        });
});


app.get('/scene-image/:sceneName', (req, res) => {
    const sceneName = req.params.sceneName;
    const imagePath = path.join(imagesDir, `${sceneName}.png`);
    var er = false

    fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (err) {
            er = true
                // console.error('File does not exist:', imagePath);
            return res.status(404).send('Image not found');
        }
        if (er) {
            console.log("one or more splash images were not found")
        }

        // Using sendFile with an absolute path
        res.sendFile(imagePath);
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})