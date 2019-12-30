'use strict';
// const location = require('./modules/location')
const express = require('express');
const superagent = require('superagent')
const server = express();
const pg = require('pg');


const cors = require('cors');
server.use(cors());

require('dotenv').config();

const PORT = process.env.PORT;
const GEOCODE_API_KEY = process.env.GEOCODE_API_KEY;
const DARKSKY_API_KEY = process.env.DARKSKY_API_KEY;
const EVENTFUL_API_KEY = process.env.EVENTFUL_API_KEY;
const MOVIE_API_KEY = process.env.MOVIE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;


server.get('/', (request, response) => {
    response.status(200).send('Okay its found');
});

server.get('/location', locationRndering);
server.get('/weather', weatherrenderring);
server.get('/events', eventfulRndering);
server.get('/movies', moviesRndering);
server.get('/yelp', yelpRndering);


// ///////////////////////////
// function locationRndering(request, response) {
//     const city = request.query.city;
//     location.getLocationData(city)
//         .then(data => render(data, response))
//         .catch((error) => errorHandler(error, request, response));
// }

function Location(locationData) {
    this.formatted_query = locationData.display_name;
    this.latitude = locationData.lat;
    this.longitude = locationData.lon;
}

function locationRndering(request, response) {
    const city = request.query.city;
    getLocationData(city)
        .then(data => render(data, response))
        .catch((error) => errorHandler(error, request, response));
}

function getLocationData(city) {
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
        .then(result => result.rows[0]);
}
// //////////////////////

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
// ///////////////////////////


function Eventful(eventData) {
    this.link = eventData[0].url;
    this.name = eventData[0].title;
    this.event_date = eventData[0].start_time;
    this.summary = eventData[0].description;
}

function eventfulRndering(request, response) {
    let city = request.query.formatted_query;
    getEventfulData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}

function getEventfulData(city) {
    const eventfulUrl = `http://api.eventful.com/json/events/search?app_key=${EVENTFUL_API_KEY}&location=${city}`;
    return superagent.get(eventfulUrl)
        .then((eventfulData) => {
            let jsonData = JSON.parse(eventfulData.text).events.event;
            // console.log(jsonData);
            const eventful = jsonData.map((day) => new Eventful(jsonData));

            return eventful;
        });
}
// //////////////////////////////////

function Movies(data){
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
}
function moviesRndering(request, response){
    let city = request.query.search_query;
    // console.log(city)
    getMoviesData(city)
        .then((data) => {
            response.status(200).send(data);
        });
    }
    function getMoviesData(city) {
        const moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&language=en-US&query=${city}&page=1&include_adult=false`
        return superagent.get(moviesUrl)
            .then((moviesData) => {
                // console.log(moviesData.body);
                const movies = moviesData.body.results.map((data) => new Movies(data));   
                return movies;
            });
            }   

            // //////////////////////////////////
  
         function Yelp(data){
             this.name = data.name;
             this.image_url = data.image_url;
             this.price =data.price;
             this.rating = data.rating;
             this.url = data.url;
         }
         function yelpRndering(request, response){
            let city = request.query.search_query;
            console.log(city)
            getYelpData(city)
                .then((data) => {
                    response.status(200).send(data);
                });
         }
         function getYelpData(city) {
            const yelpUrl = `https://api.yelp.com/v3/businesses/search?location=${city}`;
            // console.log(yelpUrl)
            return superagent.get(yelpUrl)
            .set('Authorization', `Bearer ${YELP_API_KEY}`)
                .then((yelpData) => {
                    let jsonData = JSON.parse(yelpData.text);
                    // console.log(jsonData.businesses);
                    const yelp = jsonData.businesses.map((data) => new Yelp(data));   
                    return yelp;
                });
                } 


            // //////////////////////////////////

server.use('*', (request, response) => {
    response.status(404).send('its not found ')
});
server.use((error, request, response) => {
    response.status(500).send("Sorry, something went wrong");
});
function render(data, response) {
    response.status(200).json(data)
}
function notFoundHandler(data, response) {
    response.status(404).send("NO;")
}
function errorHandler(error, request, response) {
    response.status(500).send(error)
}
function startServer() {
    server.listen(PORT, () => console.log('its work'));

}
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));
client.connect()
    .then(startServer)
    .catch(err => console.error(err));
