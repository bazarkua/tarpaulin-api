const { extractValidFields } = require("../lib/validation");
const { getDbReference } = require("../lib/mongo");
const { ObjectId } = require("mongodb");

const AssignmentSchema = {
  title: { require: true },
  points: { require: true },
  due_date: { require: true },
  course_id: { require: true }
};
exports.AssignmentSchema = AssignmentSchema;

async function insertNewAssignment(Assignment) {
    Assignment = extractValidFields(Assignment, AssignmentSchema);
  const db = getDbReference();
  const collection = db.collection("assignments");
  const result = await collection.insertOne(Assignment);
  return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;

async function getAssignmentById(id) {
  const db = getDbReference();
  const collection = db.collection("assignments");

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
exports.getAssignmentById = getAssignmentById;

async function updateAssignmentById(id, Assignment) {
  const db = getDbReference();
  const collection = db.collection("assignments");
  
  const result = await collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: Assignment }
  );

  return result.matchedCount > 0;
}
exports.updateAssignmentById = updateAssignmentById;

async function deleteAssignmentById(id) {
  const db = getDbReference();
  const collection = db.collection("assignments");
  const result = await collection.deleteOne({
    _id: new ObjectId(id),
  });
  console.log(" -- result: ", result);
  return result.deletedCount > 0;
}
exports.deleteAssignmentById = deleteAssignmentById;

async function addStudentToAssignment(AssignmentId, studentIds) {
  const db = getDbReference();
  const collection = db.collection("assignments");

  const result = await collection.updateOne(
    { _id: new ObjectId(AssignmentId) },
    { $push: { students: { $each: studentIds } } }
  );

  return result.matchedCount > 0;
}
exports.addStudentToAssignment = addStudentToAssignment;

async function removeStudentFromAssignment(AssignmentId, studentIds) {
  const db = getDbReference();
  const collection = db.collection("assignments");
  
  const result = await collection.updateOne(
    { _id: new ObjectId(AssignmentId) },
    { $pull: { students: { $in: studentIds } } }
  );

  return result.matchedCount > 0;
}
exports.removeStudentFromAssignment = removeStudentFromAssignment;

async function getEnrolledStudentsInfoFromAssignmentById(studentIds) {
  const db = getDbReference();
  const collection = db.collection("users");
  const objectIds = studentIds.map((id) => new ObjectId(id));

  const students = await collection.find({ _id: { $in: objectIds } }).toArray();
  return students;
}
exports.getEnrolledStudentsInfoFromAssignmentById =
  getEnrolledStudentsInfoFromAssignmentById;

async function updateAssignmentSubmissionsById(id, submissions) {
    const db = getDbReference()
    const collection = db.collection("assignments")

    const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { submissions: submissions } }
    )

    return result.matchedCount > 0
}
exports.updateAssignmentSubmissionsById = updateAssignmentSubmissionsById
