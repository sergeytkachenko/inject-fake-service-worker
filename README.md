# Inject service worker launcher

### Install global command line tool

```
npm i -g git+https://github.com/sergeytkachenko/inject-fake-service-worker#master
```

### Open your url in chromium and inject & register your my-service-worker.js file from local path

```
opensw --url=http://info.cern.ch --worker=./my-service-worker-example.js
```

#### Develop

https://x-team.com/blog/a-guide-to-creating-a-nodejs-command/
