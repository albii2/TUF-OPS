// src/index.ts
function createEnv(schema) {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(
      "\u274C Invalid environment variables:",
      ...Object.entries(parsed.error.flatten().fieldErrors).map(([key, value]) => `  ${key}: ${value}`)
    );
    process.exit(1);
  }
  return parsed.data;
}
export {
  createEnv
};
