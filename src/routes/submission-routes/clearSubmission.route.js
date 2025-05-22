'use strict';

import { logger, buildApiResponse } from 'common-node-lib';
import controllers from '../../controllers/index.js';

const log = logger('Router: clear-user-submissions');
const sheetControllers = controllers.sheetControllers;
const submissionControllers = controllers.submissionControllers;

// API Function
const clearSubmission = async (req, res, next) => {
  try {
    log.info('Clear submissions process initiated');
    const userId = req.user.id;
    const sheetId = req.query.sheet;
    const tagId = req.query.tag;

    log.info('Call controller function to clear the requested submissions for user');
    const submissionList = await submissionControllers.clearUserSubmissions(userId, sheetId, tagId);

    log.success('User submissions clear operation completed successfully');
    res.status(204).json(buildApiResponse(submissionList));
  } catch (err) {
    if (err.statusCode === '500') {
      log.error(`Error occurred while processing the request in router. Error: ${JSON.stringify(err)}`);
    } else {
      log.error(`Failed to complete the request. Error: ${JSON.stringify(err)}`);
    }
    next(err);
  }
};

export default clearSubmission;
