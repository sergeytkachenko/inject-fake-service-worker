#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { join } from 'path';
import path from 'path';
import fs from 'fs';
import hoxy from 'hoxy';
import commandLineArgs from 'command-line-args';

const SERVICE_WORKER_NAME = 'example-fake-service-worker';

const optionDefinitions = [
    { name: 'url', alias: 'u', type: String, defaultOption: 'http://info.cern.ch' },
    { name: 'worker', alias: 'w', type: String, defaultOption: './src/example-fake-service-worker.js' },
]
const options = commandLineArgs(optionDefinitions)

const appUrl = new URL(process.env.APP_URL ?? options.url);
const workerFile = process.env.WORKER_FILE ?? options.worker;

const proxy = hoxy.createServer().listen(8080);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceWorkerFile = path.resolve(__dirname, workerFile);
if (!fs.existsSync(serviceWorkerFile)) {
    serviceWorkerFile = path.resolve(process.cwd(), workerFile);
}
if (!fs.existsSync(serviceWorkerFile)) {
    console.error(`File not found: ${serviceWorkerFile}`);
    process.exit(0);
}
console.log(`serviceWorkerFile: ${serviceWorkerFile}`);

proxy.intercept({
    phase: 'request',
    url: new RegExp(`${SERVICE_WORKER_NAME}\\.js$`),
}, function(req, resp) {
    resp.headers = { 'Content-Type': 'application/javascript' };
    resp.string = fs.readFileSync(serviceWorkerFile);
});

proxy.log('error warn', function(event) {
    console.error(event.level + ': ' + event.message);
    if (event.error) {
        console.error(event.error.stack)
    }
});

(async () => {
    const domain = `${appUrl.protocol}//${appUrl.hostname}:${appUrl.port}`

    const browser = await puppeteer.launch({
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
    const page = await browser.newPage();
    await page.goto(appUrl.href);
    await page.evaluate((domain, serviceWorkerName) => {
        const serviceWorkerUrl = domain + `/${serviceWorkerName}.js`;
        navigator.serviceWorker
            .register(serviceWorkerUrl)
            .then(() => console.log("service worker is registered"))
            .catch(console.error);
    }, domain, SERVICE_WORKER_NAME);
})();
