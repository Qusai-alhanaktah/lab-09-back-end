'use strict';
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
// ///////////////////////////

server.get('/location', locationRndering);
server.get('/weather', weatherrenderring);
server.get('/events', eventfulRndering);
server.get('/movies', moviesRndering);
server.get('/yelp', yelpRndering);



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
    let sql = `SELECT * FROM weather WHERE search_query = $1`;
    let queryData = [city];
    // console.log(queryData)
    return client.query(sql, queryData)
    .then(result => {
        console.log(result)
        if (result.rowCount)  return result.rows[0]; 
        else {
            const weatherUrl = `https://api.darksky.net/forecast/${DARKSKY_API_KEY}/${lat},${lng}`;
            console.log(weatherUrl)
            return superagent.get(weatherUrl)
            .then(data => cacheWeather(data));
        }
    });
}
function cacheWeather(weatherData) {
    const weather = weatherData.body.daily.data.map((day) => new Weather(day));
    let newSql = `INSERT INTO weather(time, forecast) VALUES ($1, $2) RETURNING*`
    let values = [weather.time, weather.forecast];
    return client.query(newSql, values)
        .then(result => result.rows[0]);
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
// [
//     {
//       "title": "Sleepless in Seattle",
//       "overview": "A young boy who tries to set his dad up on a date after the death of his mother. He calls into a radio station to talk about his dad’s loneliness which soon leads the dad into meeting a Journalist Annie who flies to Seattle to write a story about the boy and his dad. Yet Annie ends up with more than just a story in this popular romantic comedy.",
//       "average_votes": "6.60",
//       "total_votes": "881",
//       "image_url": "https://image.tmdb.org/t/p/w500/afkYP15OeUOD0tFEmj6VvejuOcz.jpg",
//       "popularity": "8.2340",
//       "released_on": "1993-06-24"
//     },
//     {
//       "title": "Love Happens",
//       "overview": "Dr. Burke Ryan is a successful self-help author and motivational speaker with a secret. While he helps thousands of people cope with tragedy and personal loss, he secretly is unable to overcome the death of his late wife. It's not until Burke meets a fiercely independent florist named Eloise that he is forced to face his past and overcome his demons.",
//       "average_votes": "5.80",
//       "total_votes": "282",
//       "image_url": "https://image.tmdb.org/t/p/w500/pN51u0l8oSEsxAYiHUzzbMrMXH7.jpg",
//       "popularity": "15.7500",
//       "released_on": "2009-09-18"
//     },
//     ...
//   ]
function Movies(data){
    this.title = data[0].title;
    this.overview = data[0].overview;
    this.average_votes = data[0].vote_average;
    this.total_votes = data[0].vote_count;
    this.image_url = data[0].poster_path;
    this.popularity = data[0].popularity;
    this.released_on = data[0].release_date;
}
function moviesRndering(request, response){
    let city = request.query.formatted_query;
    getMoviesData(city)
        .then((data) => {
            response.status(200).send(data);
        });
    }
    function getMoviesData(city) {
        const moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${city}&total_results=20`;
        console.log(moviesUrl)
        return superagent.get(moviesUrl)
            .then((moviesData) => {
                // let jsonData = JSON.parse(moviesData.text);
                // console.log(moviesData.body.results);
                const movies = moviesData.body.results.map((data) => new Movies(data));   
                return movies;
            });
            }   

            // //////////////////////////////////
            // [
            //     {
            //       "name": "Pike Place Chowder",
            //       "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/ijju-wYoRAxWjHPTCxyQGQ/o.jpg",
            //       "price": "$$   ",
            //       "rating": "4.5",
            //       "url": "https://www.yelp.com/biz/pike-place-chowder-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
            //     },
            //     {
            //       "name": "Umi Sake House",
            //       "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c-XwgpadB530bjPUAL7oFw/o.jpg",
            //       "price": "$$   ",
            //       "rating": "4.0",
            //       "url": "https://www.yelp.com/biz/umi-sake-house-seattle?adjust_creative=uK0rfzqjBmWNj6-d3ujNVA&utm_campaign=yelp_api_v3&utm_medium=api_v3_business_search&utm_source=uK0rfzqjBmWNj6-d3ujNVA"
            //     },
            //     ...
            //   ]
         function Yelp(data){
             this.name = data.name;
             this.image_url = data.image_url;
             this.price =data.price;
             this.rating = data.rating;
             this.url = data.url;
         }
         function yelpRndering(request, response){
            let city = request.query.formatted_query;
            getYelpData(city)
                .then((data) => {
                    response.status(200).send(data);
                });
         }
         function getYelpData(city) {
            const yelpUrl = `https://api.yelp.com/v3/businesses/search?accessToken=${YELP_API_KEY}&term=food`;
            // console.log(yelpUrl)
            return superagent.get(yelpUrl)
                .then((yelpData) => {
                    // let jsonData = JSON.parse(moviesData.text);
                    console.log(yelpData);
                    const yelp = yelpData.map((data) => new Yelp(data));   
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
