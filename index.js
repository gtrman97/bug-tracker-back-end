import express from "express";
import Sequelize, { STRING } from "sequelize";
import dotenv from "dotenv";

const app = express();
dotenv.config();

// Connect to the database
const sequelize = new Sequelize(
  process.env.DATABASE_NAME,
  process.env.DATABASE_USERNAME,
  process.env.DATABASE_PASSWORD,
  {
    host: process.env.ENDPONT,
    dialect: "postgres",
    operatorsAliases: false,
  }
);

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

// Define the models
const User = sequelize.define("user", {
  name: STRING,
  email: STRING,
  password: STRING,
});

// Sync the models with the database
sequelize.sync();

// Define routes
app.get('/', (req, res) => {
    res.send('Hello from Express!')
  })

app.get("/users", (req, res) => {
  User.findAll()
    .then((users) => res.json(users))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Start the server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
