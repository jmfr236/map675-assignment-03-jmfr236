const fs = require("fs");
const csv = require("csvtojson");
const chalk = require("chalk");
const gjv = require("geojson-validation");

const inFilePath = __dirname + "/../project-files/NationalFile_20210825.txt";
const outFilePath = __dirname + "/../data/us-churches.json";
const filteredFeature = "Church";

// call function to kick off process
processCSV(inFilePath);

function processCSV(filePath) {
  // create a readStream
  const readableStream = fs.createReadStream(filePath);

  // object with which to build our GeoJSON
  const geojson = {
    type: "FeatureCollection",
    features: []
  };

  let feature; // declare once here for looping below
  let featureCount = 0; // counter variable to keep track below

  // begin a console.time object
  console.time(chalk.blue("processing time: "));

  // csvtoJson method
  csv({
    delimiter: "|"
  })
    .fromStream(readableStream) // reads from stream
    .subscribe((jsonObj, i) => {
      // output every 100k rows for progress update
      if (i % 100000 == 0) console.log("processing row #: " + chalk.blue(i));

      // if the feature is a church and has lat/long values
      if (jsonObj.FEATURE_CLASS === filteredFeature) {
        // build a GeoJSON feature for each
        feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [+jsonObj.PRIM_LONG_DEC, +jsonObj.PRIM_LAT_DEC]
          },
          properties: {
            FEATURE_NAME: jsonObj.FEATURE_NAME
          }
        };
        // push the feature into the features array
        geojson.features.push(feature);
        featureCount++;
      }
    })
    .on("done", error => {
      console.log(
        chalk.green(
          `${featureCount} "${filteredFeature}" features filtered from CSV file`
        )
      );
      validateGeoJson(geojson);
    });
}

function validateGeoJson(geojson) {
    // check to see if the GeoJSON is valid
    // function will validate GeoJSON structure
    if (gjv.valid(geojson)) {
      console.log(chalk.green("this is valid GeoJSON!"));
      // ... update call to validate GeoJSON
      writeToFile(geojson);
    } else {
      console.log(chalk.red("Sorry, not valid GeoJSON."));
    }
  }
  
  function writeToFile(geojson) {
      // write output file
      fs.writeFile(outFilePath, JSON.stringify(geojson), "utf-8", err => {
          if (err) throw err;
      
          console.log(chalk.green("done writing file"));
        });
  }