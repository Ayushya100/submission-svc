'use strict';

import { exec } from "common-node-lib";

const getSheetInfo = async(sheetId) => {
    const query = `SELECT P.ID, P.PROBLEM_CD, P.PROBLEM_TITLE, P.PROBLEM_DESC, P.INPUT_FORMAT, P.OUTPUT_FORMAT, P.CONSTRAINTS
        , P.OTHER_INFO, P.DIFFICULTY, T.TYPE_CD, T.TYPE_DESC, T.EXECUTOR
        FROM PROBLEMS P
        INNER JOIN PROBLEM_TYPE T ON T.ID = P.TYPE_ID AND T.IS_DELETED = false
        WHERE P.IS_DELETED = false AND P.APPROVED = true AND P.ID = ?;`;
    const params = [sheetId];

    return exec(query, params);
}

const getSheetTestCasesById = async(sheetId, isPublic = true) => {
    const query = `SELECT P.ID, P.PROBLEM_ID, P.INPUT_TYPE, P.OUTPUT_TYPE, P.INPUT, P.OUTPUT, P.IS_PUBLIC
        FROM PROBLEM_TEST_CASES P
        WHERE P.PROBLEM_ID = ? AND P.IS_PUBLIC = ? AND P.IS_DELETED = false;`;
    const params = [sheetId, isPublic];

    return exec(query, params);
}

const getSheetSnippetInfo = async(sheetId, languageId) => {
    const query = `SELECT S.PROBLEM_ID, S.LANGUAGE_ID, S.SNIPPET, L.LANGUAGE, L.METADATA
        FROM PROBLEM_SNIPPET S
        INNER JOIN SUPPORT_LANGUAGE L ON L.ID = S.LANGUAGE_ID AND L.IS_DELETED = false
        WHERE S.LANGUAGE_ID = ? AND S.PROBLEM_ID = ? AND S.IS_DELETED = false;`;
    const params = [languageId, sheetId];

    return exec(query, params);
}

const registerUserSubmission = async(submissionPayload) => {
    const query = `INSERT INTO USER_SUBMISSION_DTL (USER_ID, PROBLEM_ID, LANGUAGE_ID, CODE, STATUS, RUNTIME_MSG, MEMORY_MSG, ERROR_MSG, MAX_MEMORY
        , MAX_TIME, AVG_MEMORY, AVG_TIME, CREATED_BY, MODIFIED_BY)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING ID;`;
    const params = [
        submissionPayload.userId, submissionPayload.sheetId, submissionPayload.languageId, submissionPayload.code, submissionPayload.status
        , submissionPayload.runtimeMsg, submissionPayload.memoryMsg, submissionPayload.errorMsg, submissionPayload.maxMemory, submissionPayload.maxTime
        , submissionPayload.avgMemory, submissionPayload.avgTime, submissionPayload.userId, submissionPayload.userId
    ];

    return exec(query, params);
}

const getUserSubmissionStatus = async(userId, sheetId) => {
    const query = `SELECT ID, USER_ID, PROBLEM_ID, STATUS, METADATA
        FROM USER_SUBMISSION_HDR
        WHERE USER_ID = ? AND PROBLEM_ID = ?`;
    const params = [userId, sheetId];

    return exec(query, params);
}

const upsertUserSubmissionStatus = async(userId, sheetId, status, id) => {
    let query = `INSERT INTO USER_SUBMISSION_HDR (USER_ID, PROBLEM_ID, STATUS, CREATED_BY, MODIFIED_BY)
        VALUES (?, ?, ?, ?, ?);`;
    let params = [userId, sheetId, status, userId, userId];

    if (id) {
        query = `UPDATE USER_SUBMISSION_HDR SET STATUS = ?, MODIFIED_BY = ?
        WHERE USER_ID = ? AND PROBLEM_ID = ? AND IS_DELETED = false;`;
        params = [status, userId, userId, sheetId];
    }

    return exec(query, params);
}

const getSubmissionDtlInfo = async(sheetId, submissionId, deletedRecord) => {
    const query = `SELECT U.ID, U.LANGUAGE_ID, U.CODE, U.STATUS, U.RUNTIME_MSG, U.MEMORY_MSG, U.ERROR_MSG
        , U.MAX_MEMORY, U.MAX_TIME, U.AVG_MEMORY, U.AVG_TIME, U.START_TIME, U.END_TIME, U.SUBMITTED_AT
        FROM USER_SUBMISSION_DTL U
        WHERE U.ID = ? AND U.PROBLEM_ID = ? AND U.IS_DELETED = ?`;
    const params = [submissionId, sheetId, deletedRecord];

    return exec(query, params);
}

export {
    getSheetInfo,
    getSheetSnippetInfo,
    getSheetTestCasesById,
    registerUserSubmission,
    getUserSubmissionStatus,
    upsertUserSubmissionStatus, 
    getSubmissionDtlInfo
};
