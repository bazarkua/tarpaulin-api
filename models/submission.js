/*
 * Submission schema and data accessor methods
 */
const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require('node:fs')

const { extractValidFields } = require("../lib/validation")
const { getDbReference } = require("../lib/mongo")

const submissionBucket = 'submissions'

/*
 * Schema describing required/optional fields of a submission object.
 */
const SubmissionSchema = {
    assignmentId: { require: true },
    studentId: { require: true }
}
exports.SubmissionSchema = SubmissionSchema

/*
 * Executes a DB query to insert a new course into the database.  Returns
 * a Promise that resolves to the ID of the newly-created submission entry.
 */
async function insertNewSubmission(id, submission, file) {
    return new Promise((resolve, reject) => {
        submission = extractValidFields(submission, SubmissionSchema)
        if (!ObjectId.isValid(id) || !ObjectId.isValid(submission.studentId)) {
            resolve(null)
        } else {
            submission.assignmentId = new ObjectId(id)
            submission.studentId = new ObjectId(submission.studentId)
            submission.timestamp = new Date().toISOString()
            const db = getDbReference()
            const bucket = new GridFSBucket(db, { bucketName: submissionBucket})
            const metadata = {
                assignmentId: submission.assignmentId,
                studentId: submission.studentId,
                timestamp: submission.timestamp
            }
            const uploadStream = bucket.openUploadStream(
                file.filename,
                { metadata: metadata }
            )
            fs.createReadStream(file.path).pipe(uploadStream)
                .on('error', err => {
                    reject(err)
                })
                .on('finish', result => {
                    console.log("== Write success, result:", result)
                    resolve(result._id)
                })
            }
        }
    )
}
exports.insertNewSubmission = insertNewSubmission

/*
 * Executes a DB query to fetch a single specified submission based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * submission. If no submission with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getSubmissionById(id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: submissionBucket})
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        results = await bucket.find({ _id: new ObjectId(id) }).toArray()
        return results[0]
    }
}
exports.getSubmissionById = getSubmissionById

function getSubmissionDownloadStream(id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: submissionBucket})
    return bucket.openDownloadStream(new ObjectId(id))
}

exports.getSubmissionDownloadStream = getSubmissionDownloadStream