import express from "express";
import cors from "cors";
import sequelize from "./models/index.js";
import "./models/associations.js"; // wires all model relationships before sync

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";

const app = express();

// Locked to the actual frontend origin (set via env), not open to any
// site on the internet like the original `cors()` with no options.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bug Tracker API is running");
});

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);
app.use("/tickets", ticketRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});