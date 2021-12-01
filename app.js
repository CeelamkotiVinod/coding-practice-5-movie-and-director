const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//1. Get all movie names
app.get("/movies/", async (request, response) => {
  const getAllMoviesQuery = `
    SELECT 
    movie_name AS movieName
    FROM
    movie
    ORDER BY movie_id;
    `;
  const moviesList = await db.all(getAllMoviesQuery);
  response.send(moviesList);
});

//2. Add new movie
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const addMovieQuery = `
    INSERT INTO
    movie
    (director_id, movie_name, lead_actor)
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;
  const dbResponse = await db.run(addMovieQuery);
  const movie_id = dbResponse.lastID;
  response.send("Movie Successfully Added");
});

//3. GET SPECIFIC NAME
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const getSpecificMovieQuery = `
    SELECT
    movie_id AS movieId,
    director_id AS directorId,
    movie_name AS movieName,
    lead_actor AS leadActor
    FROM
    movie
    WHERE movie_id = ${movieId};
    `;
  getMovie = await db.get(getSpecificMovieQuery);
  response.send(getMovie);
});

//4. UPDATE MOVIE
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const newMovieDetails = request.body;
  const { directorId, movieName, leadActor } = newMovieDetails;

  const updateMovieQuery = `
    UPDATE
        movie
        SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
        WHERE movie_id = ${movieId};
    `;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//5. DELETE MOVIE
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
    DELETE
    FROM
    movie
    WHERE 
    movie_id = ${movieId};
    `;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

// 6. GET ALL DIRECTORS
app.get("/directors/", async (request, response) => {
  const getAllDirectors = `
    SELECT 
    director_id AS directorId,
    director_name AS directorName
    FROM
    director
    `;
  const dbDirectors = await db.all(getAllDirectors);
  response.send(dbDirectors);
});

// 7. Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMovieNamesWhoDirected = `
    SELECT 
    movie.movie_name AS movieName
    FROM
    movie INNER JOIN director
    ON movie.director_id = director.director_id
    WHERE movie.director_id = ${directorId};
    `;

  const movieNameResponse = await db.all(getMovieNamesWhoDirected);
  response.send(movieNameResponse);
});

module.exports = app;
