"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnv = createEnv;
function createEnv(schema) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
        console.error('❌ Invalid environment variables:', ...Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => `  ${key}: ${value}`));
        process.exit(1);
    }
    return parsed.data;
}
//# sourceMappingURL=index.js.map