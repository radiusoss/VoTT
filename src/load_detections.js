const ndjson = require('ndjson');
const fs = require('fs');

function load_detections(path) {
  //remove .ts extension
  path = path.slice(-3);
  let config;
  try {
    try { config = require(`${path}.json`); }
    catch { config = readNDJSON(path); }
  }
  catch {
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
        config.frames[obj.frame_num] = config.frames[obj.frame_num] || [];
        config.frames[obj.frame_num].push(obj);
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

module.exports = load_detections;
