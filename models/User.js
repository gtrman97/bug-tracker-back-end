import { DataTypes } from "sequelize";
import sequelize from "./index.js";

const User = sequelize.define("user", {
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  password: DataTypes.STRING,
});

export default User;