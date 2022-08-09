import { Fragment, useRef, useEffect, useState } from "react";
import "./Face.scss";
import * as faceapi from "face-api.js";
import Button from "@mui/material/Button";

export default function Face() {
  const videoRef = useRef();
  const canvasRef = useRef();

  useEffect(() => {
    startVideo();

    videoRef && loadModels();
  }, []);

  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      faceDetection();
    });
  };

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const [hiddenVideo, setHiddenVideo] = useState(false);

  const [neutral, setNeutral] = useState();
  const [happy, setHappy] = useState();
  const [surprised, setSurprised] = useState();
  const [angry, setAngry] = useState();
  const [sad, setSad] = useState();

  const [calm, setCalm] = useState(true);

  let currentEmotions = {
    neutral: neutral,
    happy: happy,
    surprised: surprised,
    angry: angry,
    sad: sad,
  };

  let primaryEmotion = Object.keys(currentEmotions).reduce((a, b) =>
    currentEmotions[a] > currentEmotions[b] ? a : b
  );

  useEffect(() => {
    setInterval(setCalm(primaryEmotion !== "neutral" ? false : true));
  }, [primaryEmotion]);

  const faceDetection = async () => {
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      setNeutral(detections[0].expressions.neutral);
      setHappy(detections[0].expressions.happy);
      setSurprised(detections[0].expressions.surprised);
      setAngry(detections[0].expressions.angry);
      setSad(detections[0].expressions.sad);

      canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
        videoRef.current
      );
      faceapi.matchDimensions(canvasRef.current, {
        width: 940,
        height: 650,
      });

      const resized = faceapi.resizeResults(detections, {
        width: 940,
        height: 650,
      });
      faceapi.draw.drawDetections(canvasRef.current, resized);
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);
      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);
    }, 1000);
  };

  return (
    <Fragment>
      <div className="hide-emotion-and-emotion">
        <Button
          className="activate"
          onClick={() => {
            setHiddenVideo(hiddenVideo ? false : true);
          }}
          variant="contained"
          sx={{
            mr: 5,
          }}
        >
          {hiddenVideo
            ? "activate face recognition"
            : "deactivate face recognition"}
        </Button>
        <p className="current-emotion">
          {hiddenVideo
            ? ""
            : calm
            ? `Currently calm..`
            : `CALM DOWN! ${
                primaryEmotion !== "happy"
                  ? `You\'re looking a bit too ${primaryEmotion}`
                  : ""
              }`}
        </p>
      </div>

      <div className="face">
        <div className="face-video">
          <video
            crossOrigin="anonymous"
            ref={videoRef}
            autoPlay
            muted
            className={hiddenVideo ? "hidden" : ""}
          ></video>
        </div>
        <canvas
          ref={canvasRef}
          width="940"
          height="200"
          className={
            hiddenVideo ? "hidden" : calm ? "face-canvas" : "face-canvas-angry"
          }
        />
      </div>
    </Fragment>
  );
}