"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCandidateHandler = createCandidateHandler;
exports.getCandidatesHandler = getCandidatesHandler;
exports.getCandidateByIdHandler = getCandidateByIdHandler;
exports.updateCandidateHandler = updateCandidateHandler;
exports.uploadResumeHandler = uploadResumeHandler;
exports.getCandidateActivitiesHandler = getCandidateActivitiesHandler;
exports.getRecruitingDashboardHandler = getRecruitingDashboardHandler;
const recruiting_service_1 = require("./recruiting.service");
async function createCandidateHandler(request, reply) {
    try {
        const input = request.body;
        if (!input.first_name?.trim() || !input.last_name?.trim() || !input.email?.trim()) {
            return reply.code(400).send({ error: 'First name, last name, and email are required' });
        }
        const candidate = await (0, recruiting_service_1.createCandidate)({
            ...input,
            created_by: request.currentUser?.id,
        });
        return reply.code(201).send(candidate);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to create candidate' });
    }
}
async function getCandidatesHandler(request, reply) {
    try {
        const { stage, director_id, search } = request.query;
        const candidates = await (0, recruiting_service_1.getCandidates)({
            stage,
            director_id: director_id ? Number(director_id) : undefined,
            search,
        });
        return reply.send(candidates);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get candidates' });
    }
}
async function getCandidateByIdHandler(request, reply) {
    try {
        const { id } = request.params;
        const candidate = await (0, recruiting_service_1.getCandidateById)(Number(id));
        if (!candidate)
            return reply.code(404).send({ error: 'Candidate not found' });
        return reply.send(candidate);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get candidate' });
    }
}
async function updateCandidateHandler(request, reply) {
    try {
        const { id } = request.params;
        const input = request.body;
        const candidate = await (0, recruiting_service_1.updateCandidate)(Number(id), input);
        if (!candidate)
            return reply.code(404).send({ error: 'Candidate not found' });
        return reply.send(candidate);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to update candidate' });
    }
}
async function uploadResumeHandler(request, reply) {
    try {
        const { id } = request.params;
        const data = request.body;
        // Accept either a URL or a base64-encoded file
        const resumeUrl = data?.resume_url;
        const fileData = data?.file_data; // base64
        const fileName = data?.file_name || 'resume.pdf';
        let url = resumeUrl;
        if (fileData && !url) {
            // Save base64-encoded file to disk
            const fs = await import('node:fs');
            const path = await import('node:path');
            const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
            await fs.promises.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, `${id}_${Date.now()}_${fileName}`);
            const buffer = Buffer.from(fileData, 'base64');
            await fs.promises.writeFile(filePath, buffer);
            url = `/uploads/resumes/${path.basename(filePath)}`;
        }
        if (!url)
            return reply.code(400).send({ error: 'resume_url or file_data is required' });
        const candidate = await (0, recruiting_service_1.setResumeUrl)(Number(id), url);
        if (!candidate)
            return reply.code(404).send({ error: 'Candidate not found' });
        return reply.send(candidate);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to upload resume' });
    }
}
async function getCandidateActivitiesHandler(request, reply) {
    try {
        const { id } = request.params;
        const activities = await (0, recruiting_service_1.getCandidateActivities)(Number(id));
        return reply.send(activities);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get activities' });
    }
}
async function getRecruitingDashboardHandler(request, reply) {
    try {
        const { director_id } = request.query;
        const dashboard = await (0, recruiting_service_1.getRecruitingDashboard)(director_id ? Number(director_id) : undefined);
        return reply.send(dashboard);
    }
    catch (error) {
        return reply.code(500).send({ error: error?.message || 'Failed to get dashboard' });
    }
}
//# sourceMappingURL=recruiting.controller.js.map