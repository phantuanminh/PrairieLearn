const ERR = require('async-stacktrace');
const express = require('express');
const router = express.Router();
const debug = require('debug')('prairielearn:instructorAssessment');

const error = require('../../prairielib/lib/error');
const scoreUpload = require('../../lib/score-upload');
const sqldb = require('../../prairielib/lib/sql-db');
const sqlLoader = require('../../prairielib/lib/sql-loader');

const sql = sqlLoader.loadSqlEquiv(__filename);

router.get('/', function(req, res, next) {
    debug('GET /');
    if (!res.locals.authz_data.has_course_instance_permission_view) return next(error.make(403, 'Access denied (must be a student data viewer)'));
    var params = {
        assessment_id: res.locals.assessment.id,
    };
    sqldb.query(sql.select_upload_job_sequences, params, function(err, result) {
        if (ERR(err, next)) return;
        res.locals.upload_job_sequences = result.rows;
        debug('render page');
        res.render(__filename.replace(/\.js$/, '.ejs'), res.locals);
    });
});

router.post('/', function(req, res, next) {
    if (!res.locals.authz_data.has_course_instance_permission_edit) return next(error.make(403, 'Access denied (must be a student data editor)'));
    if (req.body.__action == 'upload_instance_question_scores') {
        scoreUpload.uploadInstanceQuestionScores(res.locals.assessment.id, req.file, res.locals.user.user_id, res.locals.authn_user.user_id, function(err, job_sequence_id) {
            if (ERR(err, next)) return;
            res.redirect(res.locals.urlPrefix + '/jobSequence/' + job_sequence_id);
        });
    } else if (req.body.__action == 'upload_assessment_instance_scores') {
        scoreUpload.uploadAssessmentInstanceScores(res.locals.assessment.id, req.file, res.locals.user.user_id, res.locals.authn_user.user_id, function(err, job_sequence_id) {
            if (ERR(err, next)) return;
            res.redirect(res.locals.urlPrefix + '/jobSequence/' + job_sequence_id);
        });
    } else {
        return next(error.make(400, `unknown __action: ${req.body.__action}`, {locals: res.locals, body: req.body}));
    }
});

module.exports = router;
