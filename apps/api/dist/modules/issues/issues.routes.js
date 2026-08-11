"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issuesRoutes = issuesRoutes;
const issues_controller_1 = require("./issues.controller");
async function issuesRoutes(server) {
    // GET /issues — list all (with optional filters)
    server.get('/', issues_controller_1.listIssuesHandler);
    // GET /issues/:id — single issue detail
    server.get('/:id', issues_controller_1.getIssueHandler);
    // POST /issues — create new issue
    server.post('/', issues_controller_1.createIssueHandler);
    // PUT /issues/:id — update issue fields
    server.put('/:id', issues_controller_1.updateIssueHandler);
    // PUT /issues/:id/status — update status only (convenience endpoint)
    server.put('/:id/status', issues_controller_1.updateIssueStatusHandler);
}
//# sourceMappingURL=issues.routes.js.map