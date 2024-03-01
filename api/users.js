const { Router } = require("express");
const jwt = require("jsonwebtoken");
const { ObjectId } = require('mongodb');
const User = require("../models/user");
const Course = require("../models/course");
const Submission = require("../models/submission");
const { verifyUserCreation } = require("./auth.js");
const { secretKey } = require('./auth.js');

const router = Router();

router.get("/", verifyUserCreation, async function (req, res, next) {
    try {
      const users = await User.getAllUsers();
      res.status(200).json({ users });
    } catch (e) {
      next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    const { name, email, password, role = "student" } = req.body;
  
    try {
      const existingUser = await User.getUserByEmail(email);
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "A user with this email already exists." });
      }
      
      if (role === "admin" || role === "instructor") {
        if (!req.headers["authorization"]) {
          return res.status(401).json({ error: "Authorization token must be provided" });
        }
  
        const token = req.headers["authorization"].split(" ")[1];
        let decoded;
        
        try {
          decoded = jwt.verify(token, secretKey);
        } catch (e) {
          return res.status(401).json({ error: "Invalid token" });
        }
  
        if (decoded.role !== "admin") {
          return res.status(403).json({ error: "Not authorized." });
        }
      }
      
      const userId = await User.createUser({ name, email, password, role });
  
      const payload = { id: userId, role: role };
      const token = jwt.sign(payload, secretKey, { expiresIn: "24h" });
  
      console.log("TOKEN:", token);
  
      res.status(201).json({ id: userId, role: role, token: token});
    } catch (e) {
      next(e);
    }
  });
    
  router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.validateUser(email, password);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
  
      const payload = {
        id: user._id, // in MongoDB, the ID field is _id, not id
        role: user.role,
      };
      const token = jwt.sign(payload, secretKey, { expiresIn: "24h" });
  
      res.status(200).json({ token });
    } catch (e) {
      next(e);
    }
  });
  
  router.get("/:id", verifyUserCreation, async (req, res, next) => {
    const userId = req.params.id;
    console.log(userId)
    console.log(req.user.id)
    try {
      const user = await User.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      
      if (req.user.role === 'student' && req.user.id !== userId) {
        return res.status(403).json({ error: "Not authorized." });
      }
  
      res.status(200).json({ user });
    } catch (e) {
      next(e);
    }
  });

module.exports = router;
