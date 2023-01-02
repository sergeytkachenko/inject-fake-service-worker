import hoxy from "hoxy";
import { fileURLToPath } from "url";
import path, {join} from "path";
import puppeteer from "puppeteer";

async function run(url, workerText) {
    const SERVICE_WORKER_NAME = 'example-fake-service-worker';
    const appUrl = new URL(url);
    const proxy = hoxy.createServer().listen(8080);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    proxy.intercept({
        phase: 'request',
        url: new RegExp(`${SERVICE_WORKER_NAME}\\.js`),
    }, function(req, resp) {
        resp.headers = { 'Content-Type': 'application/javascript' };
        resp.string = workerText;
    });
    proxy.log('error warn', function(event) {
        console.error(event.level + ': ' + event.message);
        if (event.error) {
            console.error(event.error.stack)
        }
    });
    const domain = `${appUrl.protocol}//${appUrl.hostname}:${appUrl.port}`
    let browser = await puppeteer.launch({
        headless: false,
        userDataDir: join(__dirname, '.cache', 'userDataDir'),
        args: [
            '--start-maximized',
            '--proxy-server=localhost:8080',
            `--unsafely-treat-insecure-origin-as-secure=${domain}`
        ],
        devtools: true,
        defaultViewport: null,
    });
    let page = await browser.newPage();

    await page.goto(appUrl.href);

    await page.evaluate((domain, serviceWorkerName) => {
        navigator.serviceWorker.getRegistrations()
            .then((registrations) => {
                for(let registration of registrations) {
                    const scriptURL = registration?.active?.scriptURL ?? ``;
                    if (scriptURL.includes(serviceWorkerName)) {
                        console.log("service worker unregister")
                        return registration.unregister();
                    }
                }
                return Promise.resolve();
            }).then(() => {
            const serviceWorkerUrl = domain + `/${serviceWorkerName}.js`;
            return navigator.serviceWorker
                .register(serviceWorkerUrl)
                .then(() => console.log("service worker is registered"))
                .catch(console.error);
        });
    }, domain, SERVICE_WORKER_NAME);

    await page.waitForFunction(swActivate, {timeout: 30 * 1000}, SERVICE_WORKER_NAME);

    await proxy.close();
    await browser.close();

    browser = await puppeteer.launch({
        headless: false,
        userDataDir: join(__dirname, '.cache', 'userDataDir'),
        args: [
            '--start-maximized',
            `--unsafely-treat-insecure-origin-as-secure=${domain}`
        ],
        devtools: true,
        defaultViewport: null,
    });
    page = await browser.newPage();
    await page.goto(appUrl.href);

    await page.waitForFunction(swActivate, {timeout: 30 * 1000}, SERVICE_WORKER_NAME);

    return {page, browser};
}

async function swActivate(serviceWorkerName) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for(let registration of registrations) {
        const scriptURL = registration?.active?.scriptURL ?? ``;
        if (scriptURL.includes(serviceWorkerName)) {
            return true;
        }
    }
    return false;
}

export { run };