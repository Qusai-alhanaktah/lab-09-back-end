'use strict';
const superagent = require('superagent')
module.exports = getWeatherData;
function getWeatherData(lat, lng){
    const weatherUrl = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
    return superagent.get(weatherUrl)
    .then(data => cacheWeather(data));
}

function Weather(day) {
    this.time = new Date(day.time * 1000).toDateString()
    this.forecast = day.summary;
}
function weatherrenderring(request, response) {
    let lat = request.query.latitude;
    let lng = request.query.longitude;
    const city = request.query.city;
    // let {latitude, longitude }= request.query;
    getWeatherData(city, lat, lng)
        .then(data => render(data, response))
        .catch((error) => errorHandler(error, request, response));
}

function getWeatherData(city, lat, lng) {
    // let sql = `SELECT * FROM weather WHERE search_query = $1`;
    // let queryData = [city];
    // // console.log(queryData)
    // return client.query(sql, queryData)
    // .then(result => {
    //     console.log(result)
    //     if (result.rowCount)  return result.rows[0]; 
    //     else {
            const weatherUrl = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
            console.log(weatherUrl)
            return superagent.get(weatherUrl)
            .then(data => cacheWeather(data));
        // }
    // });
}
function cacheWeather(weatherData) {
    const weather = weatherData.body.daily.data.map((day) => new Weather(day));
    // let newSql = `INSERT INTO weather(time, forecast) VALUES ($1, $2) RETURNING*`
    // let values = [weather.time, weather.forecast];
    // return client.query(newSql, values)
    //     .then(result => result.rows[0]);
        return weather
}