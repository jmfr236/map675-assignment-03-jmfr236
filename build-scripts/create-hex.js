const fs = require("fs");
const turf = require("@turf/turf");
const chalk = require("chalk");

fs.readFile(__dirname + "/../data/us-churches.json", "utf8", (err, data) => {
  if (err) throw err;

  // parse the incoming GeoJSON text
  const churches = JSON.parse(data);

  createHexGrid(churches);
});

function createHexGrid(churches) {
  //console.log(churches); // output will be limited in the terminal

  // establish a bounding box
  // [ minX, minY, maxX, maxY ]
    // note that we could use turf to get a bounding box of our points, but this includes points all over the globe (US territories, etc.)
  // const bbox = turf.bbox(churches)

  // we can concentrate the map on the continental US
  // to keep our example more simple, so let's just hardcode a bbox
  // [ minX, minY, maxX, maxY ]
  const bbox = [-125, 23, -65, 50];

  // define our cell Diameter
  const cellSide = 1;
  // define units
  const options = {
    units: "degrees"
  };

  // define units for Turf

  // create the hex polygons
  let hexgrid = turf.hexGrid(bbox, cellSide, options);

  console.log(hexgrid);

  // call function to sum all points within each hexagon
  sumPoints(churches, hexgrid);
}

function sumPoints(churches, hexgrid) {
  // option for turf.booleanPointInPolygon()
  // and other variables don't
  // need redefined with each loop
  const options = {
    ignoreBoundary: true
  };
  
  // set a counter variable
  let count;

  // loop through each hex in hexgrid
  turf.featureEach(hexgrid, (hex, i) => {
    // reset counter to zero for each hex
    count = 0;

  // loop through each point point in churches
  turf.featureEach(churches, point => {
    // if the point is inside the hex
    if (turf.booleanPointInPolygon(point, hex, options)) {
      count++; // increment by one
    }
  });

  // if the count of points within that hex is greater than 0
  if (count > 0) {
    // output progress
    console.log(chalk.green("adding count of " + count + " to hex #: " + i));
  }

      // update hex properties with count
    hex.properties = Object.assign({}, hex.properties, {
      count: count
    });
  });

  console.log(chalk.blue("ready to write the hexgrid to file"));

  // truncate the coordinate precision to reduce file size
  hexgrid = turf.truncate(hexgrid, {
    precision: 5
  });
  // call function write the hexgrid to file
  writeHexGrid(hexgrid);
}

function writeHexGrid(hexgrid) {
  // stringify the hexgrid and write to file
  fs.writeFile(
    __dirname + "/../data/us-hexgrid.json",
    JSON.stringify(hexgrid),
    "utf-8",
    err => {
      if (err) throw err;
      console.log(chalk.green("done writing file!"));
    }
  );
}