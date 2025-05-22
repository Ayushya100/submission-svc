'use strict';

import { convertIdToPrettyString, convertPrettyStringToId, logger } from 'common-node-lib';
import { getSheetInfo } from '../../db/index.js';

const log = logger('Controller: register-submissions');

const getSheetInfoById = async (sheetId, languageId = null) => {
  try {
    log.info('Controller function to validate the requested sheed by the id process initiated');
    sheetId = convertPrettyStringToId(sheetId);
    if (languageId) {
      languageId = convertPrettyStringToId(languageId);
    }

    log.info('Call db query to fetch sheet details');
    let sheetDtl = await getSheetInfo(sheetId);
    if (sheetDtl.rowCount === 0) {
      log.error('No sheet info for provided id found');
      throw {
        status: 404,
        message: 'Problem details not found',
      };
    }
    sheetDtl = sheetDtl.rows[0];

    const data = {
      id: convertIdToPrettyString(sheetDtl.id),
      sheetCode: sheetDtl.problem_cd,
      title: sheetDtl.problem_title,
      description: sheetDtl.problem_desc,
      constraints: sheetDtl.constraints,
      difficulty: sheetDtl.difficulty,
      inputFormat: sheetDtl.input_format,
      outputFormat: sheetDtl.outputFormat,
      metadata: sheetDtl.other_info,
      typeCode: sheetDtl.type_cd,
      typeDesc: sheetDtl.type_desc,
      executor: sheetDtl.executor,
    };

    log.success('Basic sheet details and executor information fetched successfully');
    return {
      status: 200,
      message: 'Problem details found',
      data: data,
    };
  } catch (err) {
    if (err.status && err.message) {
      throw err;
    }
    log.error('Error occurred while validating the sheet information for provided sheet id');
    throw {
      status: 500,
      message: 'An error occurred while retrieving problem statement',
      errors: err,
    };
  }
};

export { getSheetInfoById };
