import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "./index.js";

const User = sequelize.define(
  "user",
  {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
    },
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
  }
);

export default User;