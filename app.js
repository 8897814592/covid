const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const databasePath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({ filename: databasePath, driver: sqlite3.Database });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const convertStateResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const statesArray = await database.all(getStatesQuery);
  response.send(
    statesArray.map((state) => ({
      stateId: state.state_id,
      stateName: state.sate_name,
      population: state.population,
    }))
  );
});
app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT * FROM state WHERE state_id='${stateId}';`;
  const state = await database.get(getStateQuery);
  response.send(convertStateResponseObject(state));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrict = `
    INSERT INTO district (district_name,state_Id,cases,cured,active,deaths)
    VALUES('${districtName}','${stateId}','${cases}','${cured}','${active}',''${deaths}')`;
  await database.run(postDistrict);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `
    SELECT *
    FROM district 
    WHERE district_id='${districtId}';`;
  const district = await database.get(getDistrict);
  response.send(convertDistrictResponseObject(district));
});
app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district
    WHERE district_id=${districtId};`;
  await database.run(deleteDistrict);
  response.send("District Removed");
});
app.put("/districts/:districtId", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrict = `
    UPDATE district 
    SET district_name=${districtName},
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};
    `;
  await database.run(updateDistrict);
  response.send("District Details Up");
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `
    SELECT 
    state_id 
    FROM state NATURAL JOIN district
    WHERE district_id=${districtId};`;
  const stateName = await database.get(getStateName);
  response.send({ stateName: "${stateName}" });
});
module.exports = app;
