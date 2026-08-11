"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpportunityHandler = createOpportunityHandler;
exports.getOpportunitiesByOrganizationHandler = getOpportunitiesByOrganizationHandler;
exports.getOpportunitiesHandler = getOpportunitiesHandler;
exports.updateOpportunityStageHandler = updateOpportunityStageHandler;
exports.updateOpportunityHandler = updateOpportunityHandler;
exports.getOpportunityByIdHandler = getOpportunityByIdHandler;
const opportunities_service_1 = require("./opportunities.service");
async function createOpportunityHandler(request, reply) {
    try {
        const body = request.body;
        if (!body.name?.trim()) {
            return reply.code(400).send({ message: 'Opportunity name is required' });
        }
        if (!body.organization_id && !body.organizationId) {
            return reply.code(400).send({ message: 'organization_id is required' });
        }
        // Inject auth user as created_by/updated_by if not provided
        const currentUser = request.currentUser;
        if (currentUser?.id) {
            if (!body.created_by && !body.createdBy)
                body.created_by = currentUser.id;
            if (!body.updated_by && !body.updatedBy)
                body.updated_by = currentUser.id;
            // Auto-assign rep if the creator is a REP and no rep assigned
            if ((currentUser.role === 'REP' || currentUser.role === 'TAE') && !body.assignedRep && !body.assigned_rep_id) {
                body.assigned_rep_id = currentUser.id;
            }
        }
        const opportunity = await (0, opportunities_service_1.createOpportunity)(body);
        return reply.code(201).send(opportunity);
    }
    catch (error) {
        if (error.message.includes('already exists') || error.message.includes('channel_type is required')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getOpportunitiesByOrganizationHandler(request, reply) {
    const { organizationId } = request.params;
    const opportunities = await (0, opportunities_service_1.getOpportunitiesByOrganization)(organizationId);
    return reply.send(opportunities);
}
async function getOpportunitiesHandler(request, reply) {
    const user = request.currentUser;
    const query = request.query || {};
    const opportunities = await (0, opportunities_service_1.getOpportunities)();
    // Apply stage filter if provided
    let filtered = opportunities;
    if (query.stage && query.stage !== 'ALL') {
        filtered = filtered.filter((opp) => opp.stage === query.stage);
    }
    // REP users: only see opportunities for orgs assigned to them
    if (user?.role === 'REP' || user?.role === 'TAE') {
        filtered = filtered.filter((opp) => opp.assigned_rep_id === user.id);
        return reply.send(filtered);
    }
    // Territory scoping: directors with state_market only see opps for orgs in their state(s)
    if (user?.state_market && user.role !== 'ADMIN') {
        const states = user.state_market.split(',').map((s) => s.trim());
        filtered = filtered.filter((opp) => states.includes(opp.organization_state));
        return reply.send(filtered);
    }
    return reply.send(filtered);
}
async function updateOpportunityStageHandler(request, reply) {
    const { id } = request.params;
    const { stage, changed_by, note, actual_revenue, actual_cost, loss_reason } = request.body;
    if (!stage) {
        return reply.code(400).send({ message: 'stage is required' });
    }
    // Derive changed_by from auth if not provided
    const currentUser = request.currentUser;
    const effectiveChangedBy = changed_by ?? currentUser?.id;
    try {
        const updatedOpportunity = await (0, opportunities_service_1.updateOpportunityStage)(Number(id), stage, effectiveChangedBy, note, { actual_revenue, actual_cost, loss_reason });
        return reply.send(updatedOpportunity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        if (error.message.includes('Invalid stage transition') || error.message.includes('required to close an opportunity') || error.message.includes('cannot be negative')) {
            return reply.code(400).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function updateOpportunityHandler(request, reply) {
    const { id } = request.params;
    try {
        const updatedOpportunity = await (0, opportunities_service_1.updateOpportunity)(Number(id), request.body);
        return reply.send(updatedOpportunity);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getOpportunityByIdHandler(request, reply) {
    const { id } = request.params;
    const opportunities = await (0, opportunities_service_1.getOpportunities)();
    const opp = opportunities.find((o) => o.id === Number(id));
    if (!opp)
        return reply.code(404).send({ message: 'Opportunity not found' });
    return reply.send(opp);
}
//# sourceMappingURL=opportunities.controller.js.map