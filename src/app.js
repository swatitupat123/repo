const path = require('path');
const express = require('express');
const http = require('http');
// const socketIO = require('socket.io');

const app = express();

let stream = require( '../public/ws/stream' );
const storedData=require('./dataStore')
const fse = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const { log } = require('console');
app.use(cors());
// const https=require('https')

app.use(bodyParser.json());
app.use(express.json());
const port = process.env.PORT || 3000;
const basePath = path.join(__dirname, '../public');


app.use(express.static(basePath));
// const privateKey = fse.readFileSync('./public/ssl/privatekey.key', 'utf8');
// const certificate = fse.readFileSync('./public/ssl/certificate.crt', 'utf8');



// const credentials = {
//   key: privateKey,
//   cert: certificate
// };

const server = http.createServer(app);
let io = require( 'socket.io' )( server );

app.get('/save-json',(req,res)=>{
  
  console.log("jsonData")
})



const fs = require('fs/promises'); // Import the promises version of fs

app.post('/save-form-data', async (req, res) => {
  console.log("Req data is ",req.body);
  const { RoomName, NameUser } = req.body;
  console.log(RoomName);

  storedData.RoomName = RoomName;
  storedData.UserName = NameUser;

  console.log(storedData.UserName);

  const folderPath = `./src/${RoomName}`;

  try {
    await fs.mkdir(folderPath, { recursive: true });
    console.log("Folder created successfully");
    res.sendStatus(200);
  } catch (err) {
    console.error("Error creating folder:", err);
    res.sendStatus(500);
  }
});


app.post('/test-data', (req, res) => {
  const jsonData = req.body;
  const room=storedData.RoomName;
  const userN=storedData.UserName;
  console.log(userN);
  const jsonFilePath = `./src/${room}/${userN}.json`; // Path to the JSON file
 console.log("data Recied:-",jsonData);

  fs.appendFile(jsonFilePath, JSON.stringify(jsonData) + '\n', (err) => {
      if (err) {
          console.error('Error writing to JSON file:', err);
          res.status(500).send('Error writing to JSON file');
      } else {
        console.log('Received JSON data:', req.body);
        res.status(200).send(jsonData);
      }
  });
});

// Socket.io logic goes here
io.of( '/stream' ).on( 'connection', stream );
app.get((req,res)=>{
  const indexPath = path.join(__dirname, 'index.html'); 
  res.sendFile(indexPath);
})

// Start the server
server.listen(port, () => {
  console.log('Server started on port ' + port);
});