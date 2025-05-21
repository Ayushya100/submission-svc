'use strict';

import { convertIdToPrettyString, convertPrettyStringToId, logger } from 'common-node-lib';
import { getSheetSnippetInfo, getSheetTestCasesById, registerUserSubmission, getUserSubmissionStatus, upsertUserSubmissionStatus } from '../../db/index.js';
import { batchResult, batchSubmission, formatMemory, formatTime } from '../../utils/index.js';
import { getSubmissionDtlById } from './getSubmission.controller.js';

const log = logger('Controller: register-submissions');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const pollBatchResults = async(protocol, submissionParams) => {
    try {
        while(true) {
            const result = await batchResult(protocol, submissionParams);
            const submission = result.data.submissions;

            const isAllCasesVerified = submission.every((result) => result.status.id !== 1 && result.status.id !== 2);
            if (isAllCasesVerified) {
                submission.isValid = true;
                return submission;
            }
            await sleep(1000);
        }
    } catch (err) {
        log.error('Some error occurred while polling the batch results for the submitted solutions');
        throw {
            status: 500,
            message: 'Error occurred while working with executor',
            errors: err
        };
    }
}

const getTestCasesForExecutionType = async(sheetId, executionType) => {
    try {
        log.info('Controller function to fetch required test cases operation initiated');
        const isPublic = executionType === 'PUBLIC';

        log.info('Call db query to fetch test cases based on the requested execution type for the provided sheet ID');
        let testCases = await getSheetTestCasesById(sheetId, isPublic);
        if (testCases.rowCount === 0) {
            log.error('No test cases for the provided sheet ID found');
            throw {
                status: 404,
                message: 'No Test Case found'
            };
        }
        testCases = testCases.rows;
        testCases = testCases.map((testCase) => {
            return {
                id: convertIdToPrettyString(testCase.id),
                problemId: convertIdToPrettyString(testCase.problem_id),
                inputType: testCase.input_type,
                outputType: testCase.output_type,
                input: testCase.input,
                output: testCase.output,
                isPublic: testCase.is_public
            };
        });

        log.success(`Requested test cases for ${executionType} fetched successfully`);
        return {
            status: 200,
            message: `${executionType} test cases fetched successfully`,
            data: testCases
        };
    } catch (err) {
        if (err.status && err.message) { throw err; }
        log.error('Error occurred while fetching test cases for provided sheet id');
        throw {
            status: 500,
            message: 'Error occurred while fetching required test cases',
            errors: err
        };
    }
}

const getLanguageDetails = async(sheetId, languageId) => {
    try {
        log.info('Controller function to get the required language details for provide sheet id process initiated');
        log.info('Call db query to fetch execution language details');
        let snippetDtl = await getSheetSnippetInfo(sheetId, languageId);
        if (snippetDtl.rowCount === 0) {
            log.error('No Language details found for provided language ID');
            throw {
                status: 404,
                message: 'No language info found'
            };
        }
        snippetDtl = snippetDtl.rows[0];
        snippetDtl = {
            problemId: convertIdToPrettyString(snippetDtl.problem_id),
            languageId: convertIdToPrettyString(snippetDtl.language_id),
            snippet: snippetDtl.snippet,
            language: snippetDtl.language,
            executorCode: snippetDtl.metadata
        };

        log.success('Requested language info fetched successfully');
        return {
            status: 200,
            message: 'Requested language info fetched successfully',
            data: snippetDtl
        };
    } catch (err) {
        if (err.status && err.message) { throw err; }
        log.error('Error occurred while fetching language details for provided sheet id');
        throw {
            status: 500,
            message: 'Error occurred while fetching required language details',
            errors: err
        };
    }
}

const processJudge0Submission = async(protocol, sheetId, languageId, code, executionType, testCaseDtl, snippetDtl) => {
    try {
        log.info('Controller function to process the Judge0 submission has been initiated');
        log.info(`Solution Validation for Language: ${snippetDtl.language} process initiated`);
        if (snippetDtl.executorCode === null || snippetDtl.executorCode < 45 || snippetDtl.executorCode > 74) {
            log.error('Invalid Judge0 ID');
            throw {
                status: 400,
                message: 'Invalid executor id'
            };
        }

        const submissionBatches = testCaseDtl.map((record) => {
            return {
                testCaseId: record.id,
                source_code: code,
                language_id: snippetDtl.executorCode,
                stdin: record.input,
                expected_output: record.output
            };
        });

        log.info('Batch submission operation initiated');
        const submissionResult = await batchSubmission(protocol, submissionBatches);
        if (!submissionResult.isValid) {
            log.error('Failed to submit the reference solutions to the Judge0 executor');
            return submissionResult;
        }

        const tokens = submissionResult.data.map((res) => res.token);
        const submissionParams = {
            tokens: tokens.join(','),
            base64_encoded: false
        };

        const submittedTestCases = [];
        submissionBatches.forEach((batch, index) => {
            submittedTestCases.push({
                id: batch.testCaseId,
                input: batch.stdin,
                output: batch.expected_output,
                token: submissionResult.data[index].token
            });
        });

        let maxMemoConsumption = -Infinity;
        let maxTimeConsumption = -Infinity;
        let totalMemoConsumption = 0;
        let totalTimeConsumption = 0;
        let status = 200;
        let errorMsg = '';
        let testCaseNumber = 1;
        const testCaseResponse = [];
        const failedTestCaseResponse = [];

        const submission = await pollBatchResults(protocol, submissionParams);
        for (let i = 0; i < submission.length; i++) {
            const submissionResult = submission[i];
            const submittedTestData = submittedTestCases.filter((testCase) => testCase.token === submissionResult.token);
            const responseData = {
                id: submittedTestData[0].id,
                input: submittedTestData[0].input,
                output: submittedTestData[0].output,
                actualOutput: submission[i].stdout,
                error: submission[i].stderr,
                message: submission[i].status.description,
                description: submission[i].message,
                token: submittedTestData[0].token
            };

            if (submissionResult.status.id === 4) {
                status = 422;
                testCaseNumber = i + 1;
                errorMsg = submissionResult.status.description;
            } else if (submissionResult.status.id === 5) {
                status = 408;
                testCaseNumber = i + 1;
                errorMsg = submissionResult.status.description;
            } else if (submissionResult.status.id === 6) {
                status = 400;
                testCaseNumber = i + 1;
                errorMsg = submissionResult.status.description;
            } else if (submissionResult.status.id === 14) {
                status = 415;
                testCaseNumber = i + 1;
                errorMsg = submissionResult.status.description;
            } else if (submissionResult.status.id > 6 && submissionResult.status.id < 14) {
                status = 500;
                testCaseNumber = i + 1;
                errorMsg = submissionResult.status.description;
            }
            responseData.status = status < 400 ? 'SUCCESS' : 'FAILED';

            maxMemoConsumption = Math.max(maxMemoConsumption, submissionResult.memory);
            maxTimeConsumption = Math.max(maxTimeConsumption, parseFloat(submissionResult.time));
            totalMemoConsumption = totalMemoConsumption + submissionResult.memory;
            totalTimeConsumption = parseFloat((totalTimeConsumption + parseFloat(submissionResult.time)).toFixed(3));

            if (executionType === 'PRIVATE' && status >= 400) {
                failedTestCaseResponse.push(responseData);
                break;
            } else {
                testCaseResponse.push(responseData);
            }
        }

        const avgMemoConsumption = totalMemoConsumption / submission.length;
        const avgTimeConsumption = parseFloat(totalTimeConsumption / submission.length).toFixed(3);

        const testCaseSubmissionResult = {
            langId: languageId,
            code: code,
            maxMemoConsumption: maxMemoConsumption,
            maxTimeConsumption: maxTimeConsumption,
            avgMemoConsumption: avgMemoConsumption,
            avgTimeConsumption: avgTimeConsumption
        };

        let submissionResponseData = {};
        if (executionType === 'PRIVATE' && status >= 400) {
            submissionResponseData = {
                validationStatus: false,
                testCaseResponse: failedTestCaseResponse,
                submissionResult: testCaseSubmissionResult
            };
        } else {
            submissionResponseData = {
                validationStatus: true,
                testCaseResponse: testCaseResponse,
                submissionResult: testCaseSubmissionResult
            };
        }

        let statusMsg = `Solution validation successful`;
        if (status >= 400) {
            statusMsg = `Test case ${testCaseNumber} failed with message: ${errorMsg}`;
        }

        log.success(statusMsg);
        return {
            status: 200,
            message: statusMsg,
            data: submissionResponseData
        };
    } catch (err) {
        if (err.status && err.message) { throw err; }
        log.error('Error occurred while processing code execution request');
        throw {
            status: 500,
            message: 'Error occurred while processing the submission',
            errors: err,
            isValid: false
        };
    }
}

const processUserSubmission = async(protocol, userId, sheetDtl, payload, type) => {
    try {
        log.info('Controller function to process the user submission has been has been initiated');
        const sheetId = convertPrettyStringToId(payload.sheetId);
        const languageId = convertPrettyStringToId(payload.languageId);
        userId = convertPrettyStringToId(userId);

        const code = payload.code;
        const executor = sheetDtl.executor;
        const executionType = type.trim().toUpperCase();

        let executorResponse = {};
        if (executor === 'Judge0') {
            let testCaseDtl = await getTestCasesForExecutionType(sheetId, executionType);
            testCaseDtl = testCaseDtl.data;

            let snippetDtl = await getLanguageDetails(sheetId, languageId);
            snippetDtl = snippetDtl.data;

            executorResponse = await processJudge0Submission(protocol, sheetId, languageId, code, executionType, testCaseDtl, snippetDtl); 
        } else {
            // To be developed later
        }

        const submissionStatus = executorResponse.data.validationStatus ? 'SUCCESS' : 'FAILED';
        const errorMsg = executorResponse.data.validationStatus ? executorResponse.data.testCaseResponse[0].error : {
            id: executorResponse.data.testCaseResponse[0].id,
            input: executorResponse.data.testCaseResponse[0].input,
            output: executorResponse.data.testCaseResponse[0].output,
            actualOutput: executorResponse.data.testCaseResponse[0].actualOutput,
            error: executorResponse.data.testCaseResponse[0].error,
            message: executorResponse.data.testCaseResponse[0].message,
            description: executorResponse.data.testCaseResponse[0].description,
            status: executorResponse.data.testCaseResponse[0].status
        };
        const submitPayload = {
            userId: userId,
            sheetId: sheetId,
            languageId: languageId,
            code: executorResponse.data.submissionResult.code,
            status: submissionStatus,
            runtimeMsg: executorResponse.data.testCaseResponse[0].message,
            memoryMsg: executorResponse.data.testCaseResponse[0].description,
            errorMsg: errorMsg,
            maxMemory: executorResponse.data.submissionResult.maxMemoConsumption,
            maxTime: executorResponse.data.submissionResult.maxTimeConsumption,
            avgMemory: executorResponse.data.submissionResult.avgMemoConsumption,
            avgTime: executorResponse.data.submissionResult.avgTimeConsumption
        };

        let responseData = {};
        let responseMessage = '';
        if (executionType === 'PRIVATE') {
            log.info('Call db query to check the sheet status for user');
            const sheetStatusDtl = await getUserSubmissionStatus(userId, sheetId);
            if (sheetStatusDtl.rowCount === 0 || (sheetStatusDtl.rowCount > 0 && sheetStatusDtl.rows[0].status !== 'SUCCESS')) {
                let submissionId = sheetStatusDtl.rowCount > 0 ? sheetStatusDtl.rows[0].id : null;
                await upsertUserSubmissionStatus(userId, sheetId, submissionStatus, submissionId);
            }
            let submissionId = await registerUserSubmission(submitPayload);
            submissionId = submissionId.rows[0].id;

            log.info('Call controller function to fetch the newly registered submission details from system');
            const submissionDtl = await getSubmissionDtlById(sheetId, submissionId);
            responseData = submissionDtl.data;
            responseMessage = responseData.runtimeMsg;
        } else {
            const testCaseResponse = executorResponse.data.testCaseResponse.map((testCase) => {
                return {
                    id: testCase.id,
                    input: testCase.input,
                    output: testCase.output,
                    actualOutput: testCase.output,
                    message: testCase.message,
                    error: testCase.error,
                    status: testCase.status
                };
            });

            responseMessage = executorResponse.message;
            responseData = {
                languageId: convertIdToPrettyString(executorResponse.data.submissionResult.langId),
                code: executorResponse.data.submissionResult.code,
                testCaseResponse: testCaseResponse,
                maxMemoConsumption: formatMemory(executorResponse.data.submissionResult.maxMemoConsumption),
                maxTimeConsumption: formatTime(executorResponse.data.submissionResult.maxTimeConsumption),
                avgMemoConsumption: formatMemory(executorResponse.data.submissionResult.avgMemoConsumption),
                avgTimeConsumption: formatTime(executorResponse.data.submissionResult.avgTimeConsumption),
            };
        }

        log.success('Submission operation completed successfully');
        return {
            status: 200,
            message: responseMessage,
            data: responseData
        };
    } catch (err) {
        if (err.status && err.message) { throw err; }
        log.error('Error occurred while user submission validation');
        throw {
            status: 500,
            message: 'Error occurred while validating submission',
            errors: err
        };
    }
}

export { processUserSubmission };
