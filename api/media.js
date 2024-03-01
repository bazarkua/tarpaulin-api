/*
 * API sub-router for media collection endpoints.
 */

const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getSubmissionDownloadStream } = require('../models/submission')

const router = Router()

/*
 * GET /media/submissions/:id - Route to download a specific photo.
 */
router.get('/submissions/:id', (req, res, next) => {
    try {
        if (ObjectId.isValid(req.params.id)) {
            getSubmissionDownloadStream(req.params.id)
            .on('error', err => {
                if (err.code === 'ENOENT') {
                    next()
                } else {
                    next(err)
                }
            })
            .on('file', file => {
                res.status(200)
            }).pipe(res)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router