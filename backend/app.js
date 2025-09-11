require("dotenv").config();

const express = require("express");
const neo4j = require("neo4j-driver");

const app = express();
const PORT = process.env.EXPRESS_PORT || 3000;

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);


app.get("/movies", async (req, res) => {
  const session = driver.session();

  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 50;
  if (limit > 50) limit = 50;                 

  const skip = (page - 1) * limit;

  try {
    // Consulta paginada
    const result = await session.run(
      "MATCH (m:Movie) RETURN m.title AS title, m.original_language AS language SKIP $skip LIMIT $limit",
      { skip: neo4j.int(skip), limit: neo4j.int(limit) }
    );

    const movies = result.records.map(record => ({
      title: record.get("title"),
      language: record.get("language")
    }));

    res.json({
      page,
      limit,
      results: movies.length,
      movies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await session.close();
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
