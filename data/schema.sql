DROP TABLE IF EXISTS location;

CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
);

DROP TABLE IF EXISTS weather;

CREATE TABLE weather (
    id SERIAL PRIMARY KEY,
    time VARCHAR(255),
    forecast VARCHAR(255)
);

DROP TABLE IF EXISTS events;

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    link VARCHAR(255),
    name VARCHAR(255),
    event_date VARCHAR(255),
    summary VARCHAR(255)
);
