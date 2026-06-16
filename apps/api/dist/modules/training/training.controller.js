"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesByRoleHandler = getModulesByRoleHandler;
exports.enrollUserHandler = enrollUserHandler;
exports.getEnrollmentHandler = getEnrollmentHandler;
exports.startModuleHandler = startModuleHandler;
exports.completeModuleHandler = completeModuleHandler;
exports.getProgressHandler = getProgressHandler;
exports.recordFrictionPointHandler = recordFrictionPointHandler;
exports.toggleHrDocsHandler = toggleHrDocsHandler;
exports.toggleDirectorSignoffHandler = toggleDirectorSignoffHandler;
exports.getCertificationStatusHandler = getCertificationStatusHandler;
const training_service_1 = require("./training.service");
const training_interface_1 = require("./training.interface");
async function getModulesByRoleHandler(request, reply) {
    try {
        const { role, phase } = request.query;
        if (!role || !Object.values(training_interface_1.TrainingRole).includes(role)) {
            return reply.code(400).send({ message: 'Valid role (TAE, DIRECTOR, ADMIN) is required' });
        }
        const modules = await (0, training_service_1.getModulesByRole)(role, phase);
        return reply.send(modules);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function enrollUserHandler(request, reply) {
    try {
        const { userId, role } = request.body;
        if (!userId || !role) {
            return reply.code(400).send({ message: 'userId and role are required' });
        }
        if (!Object.values(training_interface_1.TrainingRole).includes(role)) {
            return reply.code(400).send({ message: 'Valid role (TAE, DIRECTOR, ADMIN) is required' });
        }
        const enrollment = await (0, training_service_1.enrollUserInTraining)(userId, role);
        return reply.code(201).send(enrollment);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getEnrollmentHandler(request, reply) {
    try {
        const { userId } = request.query;
        if (!userId) {
            return reply.code(400).send({ message: 'userId query parameter is required' });
        }
        const enrollment = await (0, training_service_1.getUserEnrollment)(parseInt(userId, 10));
        if (!enrollment) {
            return reply.code(404).send({ message: 'Enrollment not found' });
        }
        const enrollmentWithProgress = await (0, training_service_1.getEnrollmentWithProgress)(enrollment.id);
        return reply.send(enrollmentWithProgress);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function startModuleHandler(request, reply) {
    try {
        const { enrollmentId, moduleId } = request.body;
        if (!enrollmentId || !moduleId) {
            return reply.code(400).send({ message: 'enrollmentId and moduleId are required' });
        }
        const progress = await (0, training_service_1.markModuleStarted)(enrollmentId, moduleId);
        return reply.code(200).send(progress);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function completeModuleHandler(request, reply) {
    try {
        const { enrollmentId, moduleId, timeSpentSeconds } = request.body;
        if (!enrollmentId || !moduleId) {
            return reply.code(400).send({ message: 'enrollmentId and moduleId are required' });
        }
        const result = await (0, training_service_1.markModuleCompleted)(enrollmentId, moduleId, timeSpentSeconds);
        return reply.send(result);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getProgressHandler(request, reply) {
    try {
        const { enrollmentId } = request.params;
        if (!enrollmentId) {
            return reply.code(400).send({ message: 'enrollmentId is required' });
        }
        const enrollmentWithProgress = await (0, training_service_1.getEnrollmentWithProgress)(parseInt(enrollmentId, 10));
        return reply.send(enrollmentWithProgress);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function recordFrictionPointHandler(request, reply) {
    try {
        const { enrollmentId, frictionPointText, moduleId, resolutionText } = request.body;
        if (!enrollmentId || !frictionPointText) {
            return reply.code(400).send({ message: 'enrollmentId and frictionPointText are required' });
        }
        await (0, training_service_1.recordFrictionPoint)(enrollmentId, frictionPointText, moduleId, resolutionText);
        return reply.code(201).send({ message: 'Friction point recorded' });
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function toggleHrDocsHandler(request, reply) {
    try {
        const { id } = request.params;
        const { hrDocsCompleted } = request.body;
        if (id === undefined || hrDocsCompleted === undefined) {
            return reply.code(400).send({ message: 'User id and hrDocsCompleted are required' });
        }
        const result = await (0, training_service_1.toggleHrDocs)(parseInt(id, 10), !!hrDocsCompleted);
        return reply.send(result);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function toggleDirectorSignoffHandler(request, reply) {
    try {
        const { id } = request.params;
        const { directorSignedOff } = request.body;
        if (id === undefined || directorSignedOff === undefined) {
            return reply.code(400).send({ message: 'User id and directorSignedOff are required' });
        }
        const result = await (0, training_service_1.toggleDirectorSignoff)(parseInt(id, 10), !!directorSignedOff);
        return reply.send(result);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getCertificationStatusHandler(request, reply) {
    try {
        const { id } = request.params;
        if (!id) {
            return reply.code(400).send({ message: 'User id is required' });
        }
        const result = await (0, training_service_1.getCertificationStatus)(parseInt(id, 10));
        return reply.send(result);
    }
    catch (error) {
        if (error.message.includes('not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=training.controller.js.map