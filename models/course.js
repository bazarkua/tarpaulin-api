/*
 * Business schema and data accessor methods
 */

const { extractValidFields } = require("../lib/validation");
const { getDbReference } = require("../lib/mongo");
const { ObjectId } = require("mongodb");

/*
 * Schema describing required/optional fields of a courses object.
 */

const CourseSchema = {
  subject: { require: true },
  number: { require: true },
  title: { require: true },
  term: { require: true },
  instructorId: { require: true },
  students: { require: false },
  assignments: { require: false },
};
exports.CourseSchema = CourseSchema;

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created course entry.
 */
async function insertNewCourse(course) {
  course = extractValidFields(course, CourseSchema);
  const db = getDbReference();
  const collection = db.collection("courses");
  const result = await collection.insertOne(course);
  return result.insertedId;
}
exports.insertNewCourse = insertNewCourse;

/*
 * Executes a DB query to return a single page of courses.  Returns a
 * Promise that resolves to an array containing the fetched page of courses.
 */
async function getCoursesPage(page) {
  const db = getDbReference();
  const collection = db.collection("courses");
  const count = await collection.countDocuments();

  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection
    .find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  return {
    courses: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
  };
}
exports.getCoursesPage = getCoursesPage;

/*
 * Executes a DB query to fetch detailed information about a single
 * specified business based on its ID.  Returns summary data about the Course,
 * excluding the list of students enrolled in the course and the list of Assignments
 * for the course.
 */
async function getCourseById(id) {
  const db = getDbReference();
  const collection = db.collection("courses");

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await collection
      .find({
        _id: new ObjectId(id),
      })
      .toArray();
    return results[0];
  }
}
exports.getCourseById = getCourseById;

/*
 * Executes a DB query to update a course in the database by ID.  Return (wrapped in a promise)
 * a boolean value to indicate whether or not the specified ID matched any existing documents
 */
async function updateCourseById(id, course) {
  //   console.log("  -- couse:\n ", course);
  const db = getDbReference();
  const collection = db.collection("courses");

  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: course }
  );

  //   console.log(" -- result:\n", result);

  return result.matchedCount > 0;
}
exports.updateCourseById = updateCourseById;

/*
 * Executes a DB query to delete a course in the database by ID.
 * Returns a boolean value
 * indicating whether or not an element was deleted
 */

async function deleteCourseById(id) {
  const db = getDbReference();
  const collection = db.collection("courses");
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
  });
  console.log(" -- result: ", result);
  return result.deletedCount > 0;
}
exports.deleteCourseById = deleteCourseById;

async function addStudentToCourse(courseId, studentIds) {
  const db = getDbReference();
  const collection = db.collection("courses");
  //   studentIds.forEach(async (studentId) => {
  const result = await collection.updateOne(
    { _id: new ObjectId(courseId) },
    { $push: { students: { $each: studentIds } } }
  );
  //   });
  return result.matchedCount > 0;
}
exports.addStudentToCourse = addStudentToCourse;

async function removeStudentFromCourse(courseId, studentIds) {
  const db = getDbReference();
  const collection = db.collection("courses");
  //   studentIds.forEach(async (studentId) => {
  const result = await collection.updateOne(
    { _id: new ObjectId(courseId) },
    { $pull: { students: { $in: studentIds } } }
  );
  //   });
  return result.matchedCount > 0;
}
exports.removeStudentFromCourse = removeStudentFromCourse;

async function getEnrolledStudentsInfoFromCourseById(studentIds) {
  const db = getDbReference();
  const collection = db.collection("users");
  const objectIds = studentIds.map((id) => new ObjectId(id));

  const students = await collection.find({ _id: { $in: objectIds } }).toArray();
  return students;
}
exports.getEnrolledStudentsInfoFromCourseById =
  getEnrolledStudentsInfoFromCourseById;
