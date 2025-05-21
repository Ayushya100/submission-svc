'use strict';

import { logger, buildApiResponse } from 'common-node-lib';
import controllers from '../../controllers/index.js';

const log = logger('Router: register-user-submission');
const sheetControllers = controllers.sheetControllers;
const submissionControllers = controllers.submissionControllers;

// API Function
const registerUserSubmissions = async(req, res, next) => {
    try {
        log.info('Register sheet submissions for user process initiated');
        const payload = req.body;
        const userId = req.user.id;
        const protocol = req.protocol;
        const type = req.query.type;

        log.info('Call controller function to verify if sheet info for provided sheet id exist');
        const sheetDtl = await sheetControllers.getSheetInfoById(payload.sheetId, payload.languageId);
        if (!sheetDtl.isValid) {
            throw sheetDtl;
        }

        log.info('Call controller function to process user submission');
        const submissionResult = await submissionControllers.processUserSubmission(protocol, userId, sheetDtl.data, payload, type);
        console.log(submissionResult);

        res.status(200).json(buildApiResponse(submissionResult));
    } catch (err) {
        if (err.statusCode === '500') {
            log.error(`Error occurred while processing the request in router. Error: ${JSON.stringify(err)}`);
        } else {
            log.error(`Failed to complete the request. Error: ${JSON.stringify(err)}`);
        }
        next(err);
    }
}

export default registerUserSubmissions;
