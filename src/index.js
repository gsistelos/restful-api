require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL;
const TOKEN = process.env.TOKEN;

const User = require("./User");

app.use(express.json());
app.use(cors({ origin: CLIENT_URL }));
app.use((req, res, next) => {
  if (req.headers.authorization !== TOKEN) {
    return res.status(401).send({
      message: "Unauthorized",
    });
  }
  next();
});

app.get("/api/users", async (req, res) => {
  try {
    const users = req.query ? await User.find(req.query) : await User.find();

    if (users.length === 0) {
      return res.status(404).send({
        message: "No users found",
      });
    }

    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const user = new User(req.body);

    const err = user.validateSync();

    if (err) {
      return res.status(400).send({
        message: err.message,
      });
    }

    await user.save();

    res.status(201).send({
      message: "User created",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const info = await User.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );

    if (info.modifiedCount === 0) {
      return res.status(304).end();
    }

    await User.updateOne(
      { _id: req.params.id },
      { $currentDate: { updatedAt: true } }
    );

    res.status(200).send({
      message: "User updated",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const info = await User.deleteOne({ _id: req.params.id });

    if (info.deletedCount === 0) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    res.status(200).send({
      message: "User deleted",
    });
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to database");

    app.listen(PORT, () => console.log(`Running on port ${PORT}`));
  })
  .catch((err) => {
    console.log("Failed to connect to the database:", err);
  });
