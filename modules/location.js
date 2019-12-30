'use strict';
const superagent = require('superagent');
const client = require('./client.js');
const location = {};

function Location(locationData) {
    this.formatted_query = locationData.display_name;
    this.latitude = locationData.lat;
    this.longitude = locationData.lon;
}

// function locationRndering(request, response) {
//     const city = request.query.city;
//     getLocationData(city)
//         .then(data => render(data, response))
//         .catch((error) => errorHandler(error, request, response));
// }

location.getLocationData = function(city) {
    let sql = `SELECT * FROM location WHERE search_query = $1`;
    let queryData = [city];
    return client.query(sql, queryData)
        .then(result => {
            if (result.rowCount) { return result.rows[0]; }
            else {
                const locationUrl = `https://us1.locationiq.com/v1/search.php?key=${GEOCODE_API_KEY}&q=${city}&format=json&limit=1`;
                return superagent.get(locationUrl)
                    .then(data => cacheLocation(city, data.body));
            }
        });
}
function cacheLocation(city, data) {
    let location = new Location(data[0]);
    let newSql = `INSERT INTO location(search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING*`
    let values = [city, location.formatted_query, location.latitude, location.longitude];
    return client.query(newSql, values)
        .then(result =>{
            let saveLocation = result.rows[0];
            return saveLocation;
        });
}


module.exports = location;