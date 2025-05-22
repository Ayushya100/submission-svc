'use strict';

import { Service, verifyScope } from 'common-node-lib';
import dotenv from 'dotenv';
import { serviceConfig, SUBMISSION_API } from './constants.js';
import routes from './routes/index.js';

dotenv.config({
  path: './env',
});

class SubmissionService extends Service {
  registerPublicEndpoints() {
    this.app.get(`${SUBMISSION_API}/health`, routes.healthCheck);
  }

  registerServiceEndpoints() {
    // Submission Endpoints
    this.app.post(`${SUBMISSION_API}/submission`, routes.submissionRoutes.registerUserSubmissions);
    this.app.get(`${SUBMISSION_API}/submission/:sheetId`, routes.submissionRoutes.getSubmissions);
    this.app.get(`${SUBMISSION_API}/submission/:sheetId/:submissionId`, routes.submissionRoutes.getSubmissions);
  }
}

serviceConfig.HOST = process.env.HOST || serviceConfig.HOST;
serviceConfig.PORT = process.env.PORT || serviceConfig.PORT;
serviceConfig.PROTOCOL = process.env.PROTOCOL || serviceConfig.PROTOCOL;

const service = new SubmissionService(serviceConfig, true);
service.getUserContext();
service.buildConnection();
service.testConnection();
