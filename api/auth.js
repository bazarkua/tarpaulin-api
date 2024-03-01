const jwt = require("jsonwebtoken");
const secretKey = "SuperSecret";

async function verifyUserCreation(req, res, next) {
  let decoded;

  if (req.headers["authorization"]) {
    const token = req.headers["authorization"].split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authorization token must be provided" });
    }

    try {
      decoded = await jwt.verify(token, secretKey);
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }
      next(e);
    }

    req.user = decoded; // Add decoded payload to request
  } 

  // Proceed if no user data is required or if user is an admin/instructor
  if (req.user && (req.user.role === 'admin' || req.user.role === 'instructor')) {
    next();
  } else if (req.user && (req.user.role === 'student' && req.user.id === req.params.id)) {
    // Proceed only if the student is trying to access their own data
    next();
  } else {
    return res.status(403).json({ error: "Not authorized" });
  }
}

async function verifyUser(req, res, next) {
  let decoded;

  if (req.headers["authorization"]) {
    const token = req.headers["authorization"].split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authorization token must be provided" });
    }

    try {
      decoded = await jwt.verify(token, secretKey);
    } catch (e) {
      if (e instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" });
      }
      next(e);
    }

    req.user = decoded; // Add decoded payload to request
  } 

  // Proceed if no user data is required or if user is an admin/instructor
  if (req.user) {
    next()
  } else {
    return res.status(403).json({ error: "Not authorized" });
  }
}

function verifyAdminOrInstructor(req, res, next) {
  if (req.user.role === 'admin' || req.user.role === 'instructor') {
    next()
  } else {
    res.status(403).send({
        error: "Not authorized, must be an admin or instructor"
    })
  }
}

function verifyStudent(req, res, next) {
  if (req.user.role !== 'student') {
      res.status(403).send({
          error: "Not authorized, must be a student"
      })
    } else {
    next()
  }
}

module.exports = {
  verifyUserCreation,
  verifyUser,
  verifyStudent,
  verifyAdminOrInstructor,
  secretKey
};
