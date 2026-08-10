"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.academyCommandRoutes = academyCommandRoutes;
const academy_command_controller_1 = require("./academy-command.controller");
async function academyCommandRoutes(server) {
    // Executive summary — the main command view
    server.get('/executive-summary', academy_command_controller_1.getExecutiveSummaryHandler);
    // All participants roster
    server.get('/participants', academy_command_controller_1.getParticipantsHandler);
    // Individual participant detail
    server.get('/participants/:userId', academy_command_controller_1.getParticipantDetailHandler);
    // Recent activity feed
    server.get('/recent-activity', academy_command_controller_1.getRecentActivityHandler);
    // Log an activity event
    server.post('/events', academy_command_controller_1.logEventHandler);
}
//# sourceMappingURL=academy-command.routes.js.map