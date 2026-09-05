import { DataTypes } from "sequelize";
import bcrypt from "bcrypt";
import sequelize from "./index.js";

const User = sequelize.define(
  "user",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      // Re-hash on password change so User.update({ password }) doesn't
      // accidentally store a plaintext password (beforeCreate alone won't
      // fire here).
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      // Applying a named scope replaces the default scope in Sequelize,
      // so this is the one place password comes back — used only by the
      // login route to verify credentials.
      withPassword: {},
    },
  }
);

export default User;