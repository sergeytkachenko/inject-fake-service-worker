# Inject service worker launcher

### Install global command line tool

```
npm i -g git+https://github.com/sergeytkachenko/inject-fake-service-worker#master
```

### Open url address in chromium and inject your service-worker

```
opensw --url=http://info.cern.ch --worker=./my-service-worker-example.js
```

where 
* `http://info.cern.ch` - example site address, where you need to inject your service worker
* `my-service-worker-example.js` - is local js file with 
any [service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) logic


### Limitation

* Worker with only the http sites (for supporting https need contributors)

#### Develop

https://x-team.com/blog/a-guide-to-creating-a-nodejs-command/
