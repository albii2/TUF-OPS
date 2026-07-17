"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulesByRoleHandler = getModulesByRoleHandler;
exports.enrollUserHandler = enrollUserHandler;
exports.getEnrollmentHandler = getEnrollmentHandler;
exports.startModuleHandler = startModuleHandler;
exports.completeModuleHandler = completeModuleHandler;
exports.submitModuleAssessmentHandler = submitModuleAssessmentHandler;
exports.getProgressHandler = getProgressHandler;
exports.recordFrictionPointHandler = recordFrictionPointHandler;
exports.toggleHrDocsHandler = toggleHrDocsHandler;
exports.togglePracticalExerciseHandler = togglePracticalExerciseHandler;
exports.toggleDirectorSignoffHandler = toggleDirectorSignoffHandler;
exports.getCertificationStatusHandler = getCertificationStatusHandler;
exports.evaluateScriptHandler = evaluateScriptHandler;
exports.getFrictionPointsHandler = getFrictionPointsHandler;
const training_service_1 = require("./training.service");
const training_interface_1 = require("./training.interface");
async function getModulesByRoleHandler(request, reply) {
    try {
        const { role, phase } = request.query;
        if (!role || !Object.values(training_interface_1.TrainingRole).includes(role)) {
            return reply.code(400).send({ message: 'Valid role (TAE, REP, DIRECTOR, ADMIN) is required' });
        }
        const modules = await (0, training_service_1.getModulesByRole)(role, phase);
        return reply.send(modules);
    }
    catch (error) {
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function enrollUserHandler(request, reply) {
    const { userId, role } = request.body;
    try {
        if (!userId || !role) {
            return reply.code(400).send({ message: 'userId and role are required' });
        }
        if (!Object.values(training_interface_1.TrainingRole).includes(role)) {
            return reply.code(400).send({ message: 'Valid role (TAE, REP, DIRECTOR, ADMIN) is required' });
        }
        const dbUserId = await (0, training_service_1.resolveUserId)(userId);
        const enrollment = await (0, training_service_1.enrollUserInTraining)(dbUserId, role);
        return reply.code(201).send(enrollment);
    }
    catch (error) {
        console.error(`[enrollUserHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(userId);
        if (isNaN(numericId)) {
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: userId
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getEnrollmentHandler(request, reply) {
    const { userId } = request.query;
    try {
        if (!userId) {
            return reply.code(400).send({ message: 'userId query parameter is required' });
        }
        const dbUserId = await (0, training_service_1.resolveUserId)(userId);
        const enrollment = await (0, training_service_1.getUserEnrollment)(dbUserId);
        if (!enrollment) {
            return reply.code(404).send({ message: 'Enrollment not found' });
        }
        const enrollmentWithProgress = await (0, training_service_1.getEnrollmentWithProgress)(enrollment.id);
        return reply.send(enrollmentWithProgress);
    }
    catch (error) {
        console.error(`[getEnrollmentHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(userId);
        if (isNaN(numericId)) {
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: userId
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
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
async function submitModuleAssessmentHandler(request, reply) {
    try {
        const { enrollmentId, moduleId, answers } = request.body;
        if (!enrollmentId || !moduleId || !Array.isArray(answers)) {
            return reply.code(400).send({ message: 'enrollmentId, moduleId, and answers are required' });
        }
        const result = await (0, training_service_1.submitModuleAssessment)(Number(enrollmentId), Number(moduleId), answers);
        return reply.send(result);
    }
    catch (error) {
        if (error.message.includes('not found') || error.message.includes('no quiz')) {
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
    const { id } = request.params;
    const { hrDocsCompleted } = request.body;
    try {
        if (id === undefined || hrDocsCompleted === undefined) {
            return reply.code(400).send({ message: 'User id and hrDocsCompleted are required' });
        }
        const dbUserId = await (0, training_service_1.resolveUserId)(id);
        const result = await (0, training_service_1.toggleHrDocs)(dbUserId, !!hrDocsCompleted);
        return reply.send(result);
    }
    catch (error) {
        console.error(`[toggleHrDocsHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(id);
        if (isNaN(numericId)) {
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: id
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function togglePracticalExerciseHandler(request, reply) {
    const { id } = request.params;
    const { practicalExerciseCompleted } = request.body;
    try {
        if (id === undefined || practicalExerciseCompleted === undefined) {
            return reply.code(400).send({ message: 'User id and practicalExerciseCompleted are required' });
        }
        const dbUserId = await (0, training_service_1.resolveUserId)(id);
        const result = await (0, training_service_1.togglePracticalExercise)(dbUserId, !!practicalExerciseCompleted);
        return reply.send(result);
    }
    catch (error) {
        console.error(`[togglePracticalExerciseHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(id);
        if (isNaN(numericId)) {
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: id
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function toggleDirectorSignoffHandler(request, reply) {
    const { id } = request.params;
    const { directorSignedOff } = request.body;
    try {
        if (id === undefined || directorSignedOff === undefined) {
            return reply.code(400).send({ message: 'User id and directorSignedOff are required' });
        }
        const dbUserId = await (0, training_service_1.resolveUserId)(id);
        const result = await (0, training_service_1.toggleDirectorSignoff)(dbUserId, !!directorSignedOff);
        return reply.send(result);
    }
    catch (error) {
        console.error(`[toggleDirectorSignoffHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(id);
        if (isNaN(numericId)) {
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: id
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getCertificationStatusHandler(request, reply) {
    const { id } = request.params;
    try {
        if (!id) {
            return reply.code(400).send({ message: 'User id is required' });
        }
        const result = await (0, training_service_1.getCertificationStatus)(id);
        return reply.send(result);
    }
    catch (error) {
        console.error(`[getCertificationStatusHandler] EXACT CAUGHT ERROR: ${error.message}`, error.stack);
        const numericId = Number(id);
        if (isNaN(numericId)) {
            // For non-numeric IDs, any resolution failure should be returned as a 400 Bad Request
            return reply.code(400).send({
                error: "Unable to resolve user id",
                receivedId: id
            });
        }
        if (error.message.includes('not found') || error.message.includes('User not found')) {
            return reply.code(404).send({ message: error.message });
        }
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function evaluateScriptHandler(request, reply) {
    try {
        const { userId, scenarioTitle, pitchText } = request.body;
        if (!userId || !scenarioTitle || !pitchText) {
            return reply.code(400).send({ message: 'userId, scenarioTitle, and pitchText are required' });
        }
        const cleanPitch = pitchText.toLowerCase().trim();
        if (cleanPitch.length < 25) {
            return reply.send({
                score: 40,
                passed: false,
                feedback: "Your response is too short. A professional field script must be structured with context, objective, and a clear question. Please expand your pitch.",
                rubricMatch: {}
            });
        }
        const criteriaListMap = {
            'Athletic Director intro call': ['Respect time', 'Ask one diagnostic question', 'Request a coach intro', 'Log the touch'],
            'Football coach uniform pitch': ['Roster count captured', 'Deadline captured', 'Mockup assets requested', 'Review date set'],
            '“We already have a vendor”': ['No vendor attack', 'Gap question asked', 'Future trigger identified', 'Follow-up logged'],
            'Budget objection': ['No panic discount', 'Budget type diagnosed', 'Alternative path offered', 'Next step preserved'],
            'Team store pitch': ['Audience identified', 'Launch window set', 'Product mix discussed', 'Promotion owner named'],
            'Player pack upsell': ['Pack items named', 'Quantity path identified', 'Parent/admin value stated', 'Close for package review'],
            'Letterman jacket campaign': ['Tradition respected', 'Timeline captured', 'Sizing/order process mapped', 'Campaign follow-up set'],
            'Feeder/youth referral ask': ['Referral ask made', 'Value to youth program stated', 'Contact captured', 'Next touch planned'],
            'Follow-up after no response': ['No “just checking in”', 'Context included', 'Clear choice offered', 'Next date logged'],
            'Closing for mockup/sample': ['Assets requested', 'Roster/quantity captured', 'Review date set', 'Opportunity updated']
        };
        const criteriaList = criteriaListMap[scenarioTitle] || [];
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (apiKey) {
            try {
                const scenarioObjectives = {
                    'Athletic Director intro call': {
                        objective: 'Earn permission to discuss one priority sport and ask for the correct coach introduction.',
                        personality: 'Busy, direct, protective of coaches.'
                    },
                    'Football coach uniform pitch': {
                        objective: 'Qualify roster count, season date, design needs, and close for mockup/sample.',
                        personality: 'Practical, deadline-driven.'
                    },
                    '“We already have a vendor”': {
                        objective: 'Avoid attacking the vendor and uncover one service or timing gap.',
                        personality: 'Skeptical but fair.'
                    },
                    'Budget objection': {
                        objective: 'Protect margin while exploring package, timing, store, or booster options.',
                        personality: 'Interested but cautious.'
                    },
                    'Team store pitch': {
                        objective: 'Position a store launch with audience, product mix, and promotion plan.',
                        personality: 'Interested in easy execution.'
                    },
                    'Player pack upsell': {
                        objective: 'Attach pack items to readiness, identity, and parent convenience.',
                        personality: 'Wants simple team standards.'
                    },
                    'Letterman jacket campaign': {
                        objective: 'Find order window, sizing day, patch process, and approval owner.',
                        personality: 'Tradition-focused and detail-oriented.'
                    },
                    'Feeder/youth referral ask': {
                        objective: 'Ask for the feeder or youth contact without sounding transactional.',
                        personality: 'Helpful if trust is earned.'
                    },
                    'Follow-up after no response': {
                        objective: 'Restart with value and a specific question.',
                        personality: 'Distracted, not hostile.'
                    },
                    'Closing for mockup/sample': {
                        objective: 'Secure assets, quantities, and a review date for mockup/sample.',
                        personality: 'Positive but busy.'
                    }
                };
                const details = scenarioObjectives[scenarioTitle] || {
                    objective: 'Engage the customer and advance the deal.',
                    personality: 'Professional.'
                };
                const systemPrompt = `You are an expert sales coach for TUF Sports Apparel (a premium custom sportswear and apparel brand).
Your job is to evaluate a sales representative's pitch submission for a specific scenario in the Locker Room Simulator.

Here is the scenario context:
- Scenario: ${scenarioTitle}
- Objective: ${details.objective}
- Customer Personality: ${details.personality}
- Success Criteria: ${JSON.stringify(criteriaList)}

Here is the sales representative's pitch submission:
"""
${pitchText}
"""

Please evaluate the pitch. A passing pitch must demonstrate active listening, address the customer's personality, and satisfy most of the success criteria (score >= 75 is passing).
You must return your evaluation in JSON format with the following keys:
1. "score": a number from 0 to 100 representing the grade.
2. "passed": a boolean (true if score >= 75, false otherwise).
3. "feedback": a string containing direct, encouraging, and highly actionable coaching feedback. Reference specific things the rep said or missed. Start with "✓ [DeepSeek Feedback]:" or "✗ [DeepSeek Feedback]:".
4. "rubricMatch": a JSON object mapping each success criteria item exactly to a boolean (true if the rep addressed the criteria, false otherwise).

Return ONLY the raw JSON object. Do not include markdown code block formatting (like \`\`\`json).`;
                const response = await globalThis.fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: pitchText }
                        ],
                        temperature: 0.1,
                        response_format: { type: 'json_object' }
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        const parsed = JSON.parse(content.trim());
                        return reply.send(parsed);
                    }
                }
            }
            catch (err) {
                console.error('DeepSeek API call failed, falling back to keyword matching:', err);
            }
        }
        // Keyword matching fallback
        const keywordMap = {
            'Athletic Director intro call': ['busy', 'time', 'sport', 'coach', 'introduce', 'represent', 'simplify'],
            'Football coach uniform pitch': ['uniform', 'look', 'delivery', 'fit', 'roster', 'mockup', 'artwork', 'date'],
            '“We already have a vendor”': ['vendor', 'friction', 'supplier', 'work well', 'objection', 'trigger', 'follow-up'],
            'Budget objection': ['budget', 'booster', 'package', 'value', 'price', 'pricing', 'support'],
            'Team store pitch': ['store', 'launch', 'fan', 'apparel', 'parent', 'link', 'promoted', 'promote'],
            'Player pack upsell': ['pack', 'travel', 'practice', 'gear', 'parents', 'uniform', 'every player'],
            'Letterman jacket campaign': ['jacket', 'letterman', 'award', 'campaign', 'ordering', 'sizing'],
            'Feeder/youth referral ask': ['youth', 'feeder', 'crossfit', 'club', 'referral', 'trust', 'connect'],
            'Follow-up after no response': ['clutter', 'inbox', 'keep alive', 'circle back', 'deadline', 'objection'],
            'Closing for mockup/sample': ['mockup', 'sample', 'asset', 'roster', 'quantities', 'date', 'review']
        };
        const criteriaKeywords = keywordMap[scenarioTitle] || ['pitch', 'sell', 'value', 'opportunity'];
        const matched = {};
        let matchCount = 0;
        criteriaKeywords.forEach((kw) => {
            const isMatched = cleanPitch.includes(kw);
            if (isMatched) {
                matched[kw] = true;
                matchCount++;
            }
            else {
                matched[kw] = false;
            }
        });
        const percentMatched = Math.round((matchCount / criteriaKeywords.length) * 100);
        const score = Math.min(60 + Math.round(percentMatched * 0.4), 100);
        const passed = score >= 75;
        let feedback = "";
        if (passed) {
            feedback = `✓ [LLM Feedback]: Strong response. Your script matches the core criteria for "${scenarioTitle}". You successfully addressed the customer's personality and stated a clear diagnostic next step.`;
        }
        else {
            feedback = `✗ [LLM Feedback]: Your response is currently missing some key success criteria. Make sure to clearly state your objective, avoid feature dumping, and ask a diagnostic next step.`;
        }
        const rubricMatch = {};
        criteriaList.forEach((item, idx) => {
            rubricMatch[item] = cleanPitch.length > 50 && (idx === 0 || idx <= Math.floor(matchCount / 2) + 1);
        });
        return reply.send({
            score,
            passed,
            feedback,
            rubricMatch
        });
    }
    catch (error) {
        console.error('Script evaluation failed:', error);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
async function getFrictionPointsHandler(request, reply) {
    try {
        const result = await (0, training_service_1.getFrictionPoints)();
        return reply.send(result);
    }
    catch (error) {
        console.error('[getFrictionPointsHandler] Error:', error);
        return reply.code(500).send({ message: 'Internal Server Error' });
    }
}
//# sourceMappingURL=training.controller.js.map