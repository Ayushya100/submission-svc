'use strict';

import { logger, buildApiResponse } from 'common-node-lib';
import controllers from '../../controllers/index.js';

const log = logger('Router: register-user-submission');
const sheetControllers = controllers.sheetControllers;
const submissionControllers = controllers.submissionControllers;

// API Function
const getSubmissions = async (req, res, next) => {
  try {
    log.info('Get submissions for requested sheet process initiated');
    const sheetId = req.params.sheetId;
    const submissionId = req.params.submissionId;
    const userId = req.user.id;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;

    if (req.query.limit && (req.query.limit < 5 || req.query.limit > 50)) {
      limit = 10;
    }

    log.info('Call controller function to verify if the requested sheet info for provided id exists');
    const sheetDtl = await sheetControllers.getSheetInfoById(sheetId);

    let submissionList = {};
    if (submissionId) {
      log.info('Call controller function to fetch user submission detail for requested submission id');
      submissionList = await submissionControllers.getSubmissionDtlById(sheetId, submissionId);
    } else {
      log.info('Call controller function to fetch user submission list');
      submissionList = await submissionControllers.getSubmissionList(userId, sheetId, page, limit);
    }

    res.status(200).json(buildApiResponse(submissionList));
  } catch (err) {
    if (err.statusCode === '500') {
      log.error(`Error occurred while processing the request in router. Error: ${JSON.stringify(err)}`);
    } else {
      log.error(`Failed to complete the request. Error: ${JSON.stringify(err)}`);
    }
    next(err);
  }
};

export default getSubmissions;
