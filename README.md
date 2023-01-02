# Inject service worker launcher

### Install global command line tool

```
npm i -g git+https://github.com/sergeytkachenko/inject-fake-service-worker#master
```

### Open your url in chromium and inject & register your my-service-worker.js file from local path

```
injectsw --url=http://tscore-dev-15:81/StudioENU_5097150_0105 --worker=./my-folder/my-service-worker.js
```

#### Develop

https://x-team.com/blog/a-guide-to-creating-a-nodejs-command/
