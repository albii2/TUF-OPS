const baseUrl = process.env.HTTPS_BASE_URL;
if (!baseUrl || !baseUrl.startsWith('https://')) {
    console.error('Set HTTPS_BASE_URL to an https:// URL before running this smoke check.');
    process.exit(1);
}
const routes = ['/login', '/dashboard', '/organizations', '/earnings'];
async function run() {
    for (const route of routes) {
        const response = await fetch(new URL(route, baseUrl));
        if (response.status < 200 || response.status >= 400) {
            throw new Error(`${route} returned status ${response.status}`);
        }
        console.log(`${route} -> ${response.status}`);
    }
}
run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
export {};
//# sourceMappingURL=https-smoke-check.js.map