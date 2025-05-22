'use strict';

import { convertIdToPrettyString, convertPrettyStringToId, convertToNativeTimeZone, logger } from 'common-node-lib';
import { getSubmissionDtlInfo, getSubmissionListBySheetId } from '../../db/index.js';
import { formatMemory, formatTime } from '../../utils/index.js';

const log = logger('Controller: get-submission-detail');

const getSubmissionDtlById = async (sheetId, submissionId, deletedRecord = false) => {
  try {
    log.info('Controller function to fetch the submission detail for provided id process initiated');
    sheetId = convertPrettyStringToId(sheetId);
    submissionId = convertPrettyStringToId(submissionId);

    log.info('Call db query to fetch the requested user submission detail for provided id');
    let submissionDtl = await getSubmissionDtlInfo(sheetId, submissionId, deletedRecord);
    if (submissionDtl.rowCount === 0) {
      log.error('No submission detail found for requested submission id');
      throw {
        status: 404,
        message: 'No submission detail found',
      };
    }
    submissionDtl = submissionDtl.rows[0];

    let responseMessage = submissionDtl.status === 'SUCCESS' ? 'Successfull' : submissionDtl.runtime_msg;
    const responseData = {
      id: convertIdToPrettyString(submissionDtl.id),
      languageId: convertIdToPrettyString(submissionDtl.language_id),
      status: submissionDtl.status,
      runtimeMsg: responseMessage,
      errorMsg: submissionDtl.error_msg !== null ? JSON.parse(submissionDtl.error_msg) : {},
      code: submissionDtl.code,
      maxMemoConsumption: formatMemory(submissionDtl.max_memory),
      maxTimeConsumption: formatTime(submissionDtl.max_time),
      avgMemoConsumption: formatMemory(submissionDtl.avg_memory),
      avgTimeConsumption: formatTime(submissionDtl.avg_time),
      startTime: submissionDtl.startTime !== null ? convertToNativeTimeZone(submissionDtl.startTime) : submissionDtl.startTime,
      endTime: submissionDtl.endTime !== null ? convertToNativeTimeZone(submissionDtl.endTime) : submissionDtl.endTime,
      submittedAt: convertToNativeTimeZone(submissionDtl.submitted_at),
    };

    log.success('Requested submission details fetched successfully');
    return {
      status: 200,
      message: 'Submission details found',
      data: responseData,
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

const getSubmissionList = async (userId, sheetId, page, limit) => {
  try {
    log.info('Controller function to fetch the submission list for the requested sheet id for user');
    sheetId = convertPrettyStringToId(sheetId);
    userId = convertPrettyStringToId(userId);

    const offset = (page - 1) * limit;

    log.info('Call db query to fetch the user submission list for requested sheed by id');
    let submissionList = await getSubmissionListBySheetId(userId, sheetId, limit, offset);
    if (submissionList.rowCount === 0) {
      log.info('No submission detail found by the user for requested sheet');
      return {
        status: 204,
        message: 'No submission detail found',
        data: [],
      };
    }
    submissionList = submissionList.rows;

    submissionList = submissionList.map((submission) => {
      return {
        id: convertIdToPrettyString(submission.id),
        sheetId: convertIdToPrettyString(submission.problem_id),
        languageId: convertIdToPrettyString(submission.language_id),
        status: submission.status,
        runtimeMsg: submission.runtime_msg,
        avgMemoConsumption: formatMemory(submission.avg_memory),
        avgTimeConsumption: formatTime(submission.avg_time),
        submittedAt: convertToNativeTimeZone(submission.submitted_at),
      };
    });

    log.success('Submission list for the requested sheet by the user has been fetched successfully');
    return {
      status: 200,
      message: 'Submission list found',
      data: submissionList,
    };
  } catch (err) {
    if (err.status && err.message) {
      throw err;
    }
    log.error('Error occurred while fetching the user submission list for requested sheet');
    throw {
      status: 500,
      message: 'Error occurred while fetching submissions',
      errors: err,
    };
  }
};

export { getSubmissionDtlById, getSubmissionList };
