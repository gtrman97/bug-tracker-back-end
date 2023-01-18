import express from 'express';
import Sequelize, { STRING } from 'sequelize';
const app = express();

// Connect to the database
const sequelize = new Sequelize('database_name', 'username', 'password', {
  host: 'host_name',
  dialect: 'postgres',
  operatorsAliases: false
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Define the models
const User = sequelize.define('user', {
  name: STRING,
  email: STRING,
  password: STRING
});

// Sync the models with the database
sequelize.sync();

// Define routes
app.get('/users', (req, res) => {
  User.findAll().then(users => {
    res.json(users);
  });
});

// Start the server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
