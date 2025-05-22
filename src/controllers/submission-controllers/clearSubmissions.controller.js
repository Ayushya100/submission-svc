'use strict';

import { convertPrettyStringToId, logger } from 'common-node-lib';
import { clearSubmissionsForUser } from '../../db/index.js';

const log = logger('Controller: clear-submissions');

const clearUserSubmissions = async (userId, sheetId = null, tagId = null) => {
  try {
    log.info('Controller function to clear the requested submissions for the user');
    userId = convertPrettyStringToId(userId);
    if (sheetId) {
      sheetId = convertPrettyStringToId(sheetId);
    }
    if (tagId) {
      tagId = convertPrettyStringToId(tagId);
    }

    log.info('Call db query to clear user submissions');
    await clearSubmissionsForUser(userId, sheetId, tagId);

    return {
      status: 204,
      message: 'Submissions cleared successfully',
      data: {},
    };
  } catch (err) {
    if (err.status && err.message) {
      throw err;
    }
    log.error('Error occurred while fetching submission detail for provided id');
    throw {
      status: 500,
      message: 'Error occurred while fetching submission detail',
      errors: err,
    };
  }
};

export { clearUserSubmissions };
