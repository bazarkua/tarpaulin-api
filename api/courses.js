const { Router } = require("express");
const { validateAgainstSchema } = require("../lib/validation");
const {
  CourseSchema,
  getCoursesPage,
  getCourseById,
  updateCourseById,
  deleteCourseById,
  addStudentToCourse,
  removeStudentFromCourse,
  getEnrolledStudentsInfoFromCourseById,
} = require("../models/course");
const { insertNewCourse } = require("../models/course");
const { getDbReference } = require("../lib/mongo");

const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const stringify = require("csv-stringify");

const { Transform } = require("stream");
const { ObjectId } = require("mongodb");
const { verifyUser } = require("./auth");

const router = Router();

router.post("/", verifyUser, async (req, res, next) => {
  console.log(" -- req.body: ", req.body);
  if (validateAgainstSchema(req.body, CourseSchema)) {
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "Unauthorized!" });
      return;
    }
    try {
      console.log("  -- Create a new course");
      const id = await insertNewCourse(req.body);
      console.log("  -- id: ", id);
      res.status(201).send({
        id: id,
      });
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid course object",
    });
  }
});

router.get("/", async (req, res, next) => {
  try {
    console.log("  -- Fetch the list of all courses");

    const coursePage = await getCoursesPage(parseInt(req.query.page) || 1);
    coursePage.links = {};
    if (coursePage.page < coursePage.totalPages) {
      coursePage.links.nextPage = `/courses?page=${coursePage.page + 1}`;
      coursePage.links.lastPage = `/courses?page=${coursePage.totalPages}`;
    }
    if (coursePage.page > 1) {
      coursePage.links.prevPage = `/courses?page=${coursePage.page - 1}`;
      coursePage.links.firstPage = "/courses?page=1";
    }

    res.status(200).send(coursePage);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    console.log(`  -- Fetch data about a specific course: ${req.params.id}`);
    const course = await getCourseById(req.params.id);
    if (course) {
      res.status(200).send(course);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", verifyUser, async (req, res, next) => {
  try {
    console.log(`  -- Update data about a specific course: ${req.params.id}`);
    if (validateAgainstSchema(req.body, CourseSchema)) {
      const course = await getCourseById(req.params.id);
      const instructorId = course.instructorId;
      if (
        req.user.role !== "admin" &&
        !(req.user.role === "instructor" && req.user.userId === instructorId)
      ) {
        res.status(403).json({ error: "Unauthorized!" });
        return;
      }
      const updateSuccessful = await updateCourseById(req.params.id, req.body);
      //   console.log("  -- updateSuccessful: ", updateSuccessful);
      if (updateSuccessful) {
        res.status(200).send("Success!");
      } else {
        next();
      }
    } else {
      res.status(400).send({
        err: "Request body does not contain a valid course.",
      });
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", verifyUser, async (req, res, next) => {
  try {
    console.log(`  -- Remove a specific course: ${req.params.id}`);
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "Unauthorized!" });
      return;
    }
    const deleteSuccessful = await deleteCourseById(req.params.id);
    // console.log("deleteSuc: ", deleteSuccessful);
    if (deleteSuccessful) {
      res.status(204).send();
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

router.post("/:id/students", verifyUser, async (req, res, next) => {
  if (req.body && (req.body.add || req.body.remove)) {
    const course = await getCourseById(req.params.id);
    const instructorId = course.instructorId;
    console.log(" -- role:", req.user.role);
    if (
      req.user.role !== "admin" &&
      !(req.user.role === "instructor" && req.user.userId === instructorId)
    ) {
      res.status(403).json({ error: "Unauthorized!" });
      return;
    }
    try {
      console.log(
        `  -- Update enrollment for a specific course: ${req.params.id}`
      );
      const course = await getCourseById(req.params.id);
      // console.log(" -- req.body:\n ", req.body.add);

      if (course) {
        if (req.body.add) {
          //   const db = getDbReference();
          //   const collection = db.collection("users");
          const addSuccessful = await addStudentToCourse(
            req.params.id,
            req.body.add
          );
        }
        if (req.body.remove) {
          const removeSuccessful = await removeStudentFromCourse(
            req.params.id,
            req.body.remove
          );
        }
        res.status(200).send();
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  } else {
    res.status(400).send({
      error: "Request body is not valid",
    });
  }
});

router.get("/:id/students", verifyUser, async (req, res, next) => {
  const course = await getCourseById(req.params.id);
  const instructorId = course.instructorId;
  if (
    req.user.role !== "admin" &&
    !(req.user.role === "instructor") & (req.user.userId === instructorId)
  ) {
    res.status(403).json({ error: "Unauthorized!" });
    return;
  }
  try {
    console.log(
      `  -- Fetch a list of the students enrolled in a specific course: ${req.params.id}`
    );
    const course = await getCourseById(req.params.id);
    if (course) {
      const students = await getEnrolledStudentsInfoFromCourseById(
        course.students
      );
      res.status(200).send({
        students: students,
      });
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});

router.get("/:id/roster", verifyUser, async (req, res, next) => {
  const course = await getCourseById(req.params.id);
  const instructorId = course.instructorId;

  const db = getDbReference();
  const collection = db.collection("users");
  if (
    req.user.role !== "admin" &&
    !(req.user.role === "instructor") & (req.user.userId === instructorId)
  ) {
    res.status(403).json({ error: "Unauthorized!" });
    return;
  }

  try {
    console.log(
      `  -- Fetch a csv file containing a list of student enrollment for a specific course: ${req.params.id}`
    );
    const course = await getCourseById(req.params.id);

    const studentIds = course.students;
    const objectIds = studentIds.map((id) => new ObjectId(id));
    console.log(" -- studentIds:", studentIds);
    const students = await collection
      .find({ _id: { $in: objectIds } })
      .toArray();
    console.log(students);

    const csvData = students
      .map((student) => {
        return `${student._id},"${student.name}",${student.email}`;
      })
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="roster.csv"');
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/assignments", async (req, res, next) => {
  try {
    console.log(
      `  -- Fetch a list of assignments for a specific course: ${req.params.id}`
    );

    const db = getDbReference();
    const collection = db.collection("assignments");

    if (ObjectId.isValid(req.params.id)) {
      const results = await collection
        .find({
          courseId: req.params.id,
        })
        .toArray();
      if (results.length !== 0) {
        res.status(200).send({
          assignments: results,
        });
      } else {
        next();
      }
    } else {
      next();
    }

    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
