'use strict';

import { processUserSubmission } from './registerSubmissions.controller.js';
import { getSubmissionDtlById, getSubmissionList } from './getSubmission.controller.js';
import { clearUserSubmissions } from './clearSubmissions.controller.js';

export default {
  processUserSubmission,
  getSubmissionDtlById,
  getSubmissionList,
  clearUserSubmissions,
};
