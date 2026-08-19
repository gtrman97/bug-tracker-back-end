import express from "express";
import cors from "cors";
import sequelize from "./models/index.js";
import User from "./models/User.js";
import Ticket from "./models/Ticket.js";

const app = express();

app.use(cors());
app.use(express.json());

// Test the connection and sync models with the database
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    return sequelize.sync();
  })
  .then(() => {
    console.log("All models synced.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.get("/", (req, res) => {
  res.send("Bug Tracker API is running");
});

app.get("/users", (req, res) => {
  User.findAll()
    .then((users) => res.json(users))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.get("/tickets", (req, res) => {
  Ticket.findAll({ include: { model: User, as: "assignee" } })
    .then((tickets) => res.json(tickets))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});