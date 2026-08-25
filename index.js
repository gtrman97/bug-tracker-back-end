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

app.post("/users", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  User.create({ name, email, password })
    .then((user) => User.findByPk(user.id))
    .then((user) => res.status(201).json(user))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.post("/tickets", (req, res) => {
  const { title, description, status, assigneeId } = req.body;

  if (!title || !assigneeId) {
    return res.status(400).json({ error: "title and assigneeId are required" });
  }

  Ticket.create({ title, description, status, assigneeId })
    .then((ticket) => Ticket.findByPk(ticket.id, { include: { model: User, as: "assignee" } }))
    .then((ticket) => res.status(201).json(ticket))
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.patch("/tickets/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, status, assigneeId } = req.body;

  Ticket.findByPk(id)
    .then((ticket) => {
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      return ticket.update({ title, description, status, assigneeId });
    })
    .then((updated) => {
      if (!updated) return; // already responded with 404 above
      return Ticket.findByPk(id, { include: { model: User, as: "assignee" } });
    })
    .then((ticket) => {
      if (ticket) res.json(ticket);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

app.delete("/tickets/:id", (req, res) => {
  const { id } = req.params;

  Ticket.findByPk(id)
    .then((ticket) => {
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      return ticket.destroy().then(() => res.status(204).send());
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});