import h from './helpers.js';


const video = document.getElementById("video");
let allDetections = {};


Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(getAndSetUserStream);




const user=sessionStorage.getItem( 'username' );
var myStream = '';
function getAndSetUserStream() {
  h.getUserFullMedia().then( ( stream ) => {
      //save my stream
      myStream = stream;

      h.setLocalStream( stream );
  } ).catch( ( e ) => {
      console.error( `stream error: ${ e }` );
  } );
  loadVideo(username);
}

function loadVideo(username){
  video.addEventListener("playing", async () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
  
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();
  
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  
      if (detections && detections.length > 0) {
        detections.forEach((resizedDetections, index) => {
          const name = sessionStorage.getItem( 'username' );
          const personKey = `${name}_${index + 1}`;
          
          const gender = resizedDetections.gender;
          const expressions = resizedDetections.expressions;
          const maxValue = Math.max(...Object.values(expressions));
          const emotion = Object.keys(expressions).filter(
            (item) => expressions[item] === maxValue
          );
  
          const leftEye = resizedDetections.landmarks.getLeftEye()[0];
          const rightEye = resizedDetections.landmarks.getRightEye()[0];
          let gazeDirection = "";
          if (leftEye && rightEye) {
            const horizontalOffset = (rightEye.x - leftEye.x) / video.width;
            console.log(horizontalOffset)
            if (horizontalOffset > 0.4) {
              gazeDirection = "Looking camera";
            } else if (horizontalOffset < 0.4) {
              gazeDirection = "Away from Camera";
            }
          }
  
          var date = new Date();
  
          if (!allDetections[personKey]) {
            allDetections[personKey] = {
              detections: [],
              Attentative: 0,
              Non_Attentative: 0,
            };
          }  
          allDetections[personKey].detections.push({
            gender: gender,
            emotion: emotion[0],
            gaze: gazeDirection,
            timestamp: date.getTime(),
          });
        });
      }
    }, 2000);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  const leaveButton = document.getElementById("leave-room");
  leaveButton.addEventListener("click", handlebuttonclick);
});

function handlebuttonclick()
{
  calculatePercentages();
  saveDetectionsToFile();
}

function calculatePercentages() {
  Object.keys(allDetections).forEach((personKey) => {
    const personDetections = allDetections[personKey].detections;
    let lookingCameraCount = 0;
    let lookingAwayCount = 0;

    personDetections.forEach((detection) => {
      if (detection.gaze === "Looking camera") {
        lookingCameraCount++;
      } else if (detection.gaze === "Away from Camera") {
        lookingAwayCount++;
      }
    });

    const totalDetections = lookingCameraCount + lookingAwayCount;
    const Attentative = (lookingCameraCount / totalDetections) * 100;
    const Non_Attentative = (lookingAwayCount / totalDetections) * 100;

    allDetections[personKey].Attentative = Attentative.toFixed(2);
    allDetections[personKey].Non_Attentative = Non_Attentative.toFixed(2);
  });
}

function saveDetectionsToFile(){
  const jsonData = JSON.stringify(allDetections, null, 2);
  console.log(jsonData);
    fetch("/test-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonData,
    })
      .then((response) => response.text())
      .then((data) => {
        console.log("JSON data saved successfully",data); // Should print 'JSON data saved successfully'
      })
      .catch((error) => {
        console.error("Error sending JSON data:", error);
      });
  }