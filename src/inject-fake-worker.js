const BUILD_NUMBER = new Date().getTime();
const CACHE_NAME = `rewrite-creatio-`;
const getCacheKey = function () {
    return CACHE_NAME + BUILD_NUMBER;
};
self.addEventListener("install", (event) => {
    console.log("service worker is install", event);
});
self.addEventListener("activate", (event) => {
    console.log("service worker is activate");
    event.waitUntil(
        self.clients
            .claim()
            .then(() => caches.keys())
            .then((cacheKeys) => {
                return Promise.all(
                    cacheKeys
                        .filter((cacheKey) => {
                            if (cacheKey.startsWith(CACHE_NAME)) {
                                return cacheKey !== getCacheKey();
                            }
                        })
                        .map((cacheKey) => caches.delete(cacheKey))
                );
            })
            .then(() =>
                console.log(`CACHE with mask: "${CACHE_NAME}" has been removed`)
            )
    );
});
self.addEventListener("fetch", proxyResources);

String.prototype.hashCode = function () {
    let hash = 0;
    for (var i = 0; i < this.length; i++) {
        let char = this.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

async function getCachedRequest(request) {
    const clonedRequest = request.clone();
    if (request.method === "POST") {
        let url = request.url;
        try {
            const json = await clonedRequest.json();
            const hashCode = JSON.stringify(json).hashCode().toString();
            url = new URL(request.url + hashCode);
        } catch(e) {}
        return new Request(url, { method: "GET" });
    }
    return clonedRequest;
}
function proxyResources(event) {
    event.respondWith(
        getCachedRequest(event.request).then((cachedRequest) => {
            return caches
                .open(getCacheKey())
                .then((cache) => cache.match(cachedRequest))
                .then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    return fetch(event.request)
                        .then((response) => {
                            return caches
                                .open(getCacheKey())
                                .then((cache) => cache.put(cachedRequest.clone(), response.clone()))
                                .then(() => response)
                                .catch((err) => console.error(err));
                        })
                        .catch((err) => console.error(err));
                });
        })
    );
}