#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import commandLineArgs from 'command-line-args';

import { run } from './index.js';

(async () => {
    const optionDefinitions = [
        { name: 'url', alias: 'u', type: String, defaultOption: 'http://info.cern.ch' },
        { name: 'worker', alias: 'w', type: String, defaultOption: './example-fake-service-worker.js' },
    ]
    const options = commandLineArgs(optionDefinitions)
    const appUrl = new URL(process.env.APP_URL ?? options.url);
    const workerFile = process.env.WORKER_FILE ?? options.worker;
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
    const workerText = fs.readFileSync(serviceWorkerFile);
    const {page, browser} = await run({appUrl, workerText});
})();
