require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const {connectToRedis, rateLimit} = require('./lib/redis')

const api = require("./api");
const { connectToDb } = require("./lib/mongo");

const app = express();
const port = process.env.PORT || 8000;

app.use(rateLimit)

app.use(morgan("dev"));

app.use(express.json());

app.use("/", api);

app.use("*", function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist",
  });
});

app.use("*", function (err, req, res, next) {
  console.error("== Error:", err);
  res.status(500).send({
    err: "Server error. Please try again later.",
  });
});

connectToRedis(
  connectToDb(
    function () {
      app.listen(port, function () {
      console.log("== Server is running on port", port);
    });
  })
);
