const ndjson = require('ndjson');
const fs = require('fs');

// Pulled from default width of new window in main.js
const defaultWidth = 800;
const defaultHeight = 600;

function loadDetections(path) {
  console.log('attempting to load detections');
  //remove .m4v extension
  path = path.slice(0, -4);
  let config;
  try {
    try {
      config = require(`${path}.m4v.json`);
    } catch (err) {
      config = readNDJSON(path);
    }
  } catch (err) {
    console.log(`${path} not found`);
    return undefined;
  }
  return config;
}

function promisfiedReadStream(path) {
  return new Promise((resolve, reject) => {
    try {
      let config = {
        frames: {},
        inputTags: new Set(),
      };
      const detectionStream = fs.createReadStream(`${path}.json`).pipe(ndjson.parse());
      detectionStream.on('data', function(obj) {
        config.frames[Math.trunc(obj.frame_num)] = config.frames[Math.trunc(obj.frame_num)] || [];
        config.frames[Math.trunc(obj.frame_num)].push(convertToVottFormat(obj, config.frames[Math.trunc(obj.frame_num)].length));
        config.inputTags.add(obj.labels);
      });
      detectionStream.on('end', () => {
        config.inputTags = Array.from(config.inputTags).join();
        resolve(config);
      });
      detectionStream.on('error', (error) => {
        reject(error);
      })
    }
    catch (error){
      reject(error);
    }
  });
}

function convertToVottFormat(detection, index) {
  return {
    "x1": Math.floor(detection.tl_x * defaultWidth),
    "y1": Math.floor(detection.tl_y * defaultHeight),
    "x2": Math.floor(detection.br_x * defaultWidth),
    "y2": Math.floor(detection.br_y * defaultHeight),
    "id": Math.trunc(detection.frame_num),
    "width": 800,
    "height": 600,
    "type": "Rectangle",
    "tags": [detection.labels],
    "name": index,
  }
}

async function readNDJSON(path) {
  let config;
  try {
    config = await promisfiedReadStream(path);
  }
  catch (error) {
    throw error;
  }
  return config;
}

module.exports = loadDetections;
