#!/usr/bin/env node
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { join } from 'path';
import path from 'path';
import fs from 'fs';
import hoxy from 'hoxy';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
    { name: 'url', alias: 'u', type: String, defaultOption: 'http://info.cern.ch' },
    { name: 'worker', alias: 'w', type: String, defaultOption: './src/example-fake-service-worker.js' },
]
const options = commandLineArgs(optionDefinitions)

const serviceWorkerName = 'example-fake-service-worker';
const proxy = hoxy.createServer().listen(8080);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceWorkerFile = path.resolve(__dirname, `./${serviceWorkerName}.js`);
if (options.worker) {
    serviceWorkerFile = path.resolve(__dirname, options.worker);
    console.log('serviceWorkerFile', serviceWorkerFile);
}
if (!fs.existsSync(serviceWorkerFile)) {
    console.error(`File not found: ${serviceWorkerFile}`);
    process.exit(0);
}

proxy.intercept({
    phase: 'request',
    url: new RegExp(`${serviceWorkerName}\\.js$`),
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
    const appUrl = new URL(process.env.APP_URL ?? options.url);
    const domain = `${appUrl.protocol}//${appUrl.hostname}:${appUrl.port}`

    const browser = await puppeteer.launch({
        headless: false,
        userDataDir: join(__dirname, '.cache', 'userDataDir'),
        args: [
            '--proxy-server=localhost:8080',
            `--unsafely-treat-insecure-origin-as-secure=${domain}`
        ],
        devtools: true
    });
    const page = await browser.newPage();
    await page.goto(appUrl.href);
    await page.evaluate((domain, serviceWorkerName) => {
        const serviceWorkerUrl = domain + `/${serviceWorkerName}.js`;
        navigator.serviceWorker
            .register(serviceWorkerUrl)
            .then(() => console.log("service worker is registered"))
            .catch(console.error);
    }, domain, serviceWorkerName);
    // try {
    //     await page.waitForSelector('#loginEdit-el');
    //     await page.click('#loginEdit-el', { clickCount: 3 })
    //     await page.keyboard.press('Backspace');
    //     await page.type('#loginEdit-el', 'Supervisor');
    //     await page.type('#passwordEdit-el', 'Supervisor');
    //     await page.click('.login-button-login');
    // } catch (e) {}
    //
    // const crtSchemaSelector = 'crt-schema.crt-schema';
    // await page.waitForSelector(crtSchemaSelector, {timeout: 180 * 1000});
    //
    // const sectionSelector = 'usrstkachenko_listpage';
    // await page.waitForSelector(sectionSelector, {timeout: 180 * 1000});
    // console.log('SUCCESS');
    // fs.writeFileSync('./cache.json', JSON.stringify(Object.keys(cache), null, 4))
    // await browser.close();
})();
