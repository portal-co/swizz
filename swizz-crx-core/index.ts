export const ruleId = 69420;
function go(chrome: any): { swjs: string } {
    const u = chrome.runtime.getURL("/");
    chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [ruleId],
        addRules: [
            {
                id: ruleId,
                priority: 1,
                condition: {
                    "regexFilter": `^https://[^/]*/(${u}/.*)`
                },
                action: { type: "redirect", redirect: { regexSubstitution: `\\1` } }
            }]
    });
    let x = new class {
        #swjs: string = `throw new RuntimeError()`;
        get swjs() {
            return this.#swjs;
        }
        set swjs(a: string) {
            this.#swjs = a;
        }
        async handleEvent(event: any) {
            // event => {
            const url = new URL((event as any).request.url);
            if (url.pathname == "/sw_impl.js") {
                (event as any).respondWith(new Response(`${this.#swjs}`));
            } else if (url.pathname == "/sw.js") {
                event.respondWith(new Response(`importScripts(${JSON.stringify(`${u}/sw_impl.js`)})`));
            } else if (url.pathname == "/shared_worker_boot.js") {
                let url = new URL(event.request.url);
                let loader = `${u}/loader.js`;
                let q = url.searchParams.get("url");
                if (q === null) {
                    return new Response(loader);
                } else {
                    let t = url.searchParams.get("type") || "classic";
                    let loader = event.request.url.split("?")[0];
                    let f = await fetch(atob(q));
                    let reader = ((s = f.body) => s === null ? s : new ReadableStream({
                        async start(controller) {
                            controller.enqueue(t === "module" ? `import ${JSON.stringify(loader)};` : `importScripts(${JSON.stringify(loader)});`);
                            for await (let t of s) {
                                controller.enqueue(t);
                            }
                        },
                    }))();
                    return new Response(reader, f);
                }
            }
            // }
        }
    };
    globalThis.addEventListener('fetch', x.handleEvent.bind(x))
    return x;
}
let swjs;
export default 'browser' in globalThis ? go(globalThis.browser) : 'chrome' in globalThis ? go(globalThis.chrome) : {
    get swjs() {
        return swjs;
    },
    set swjs(a) {
        swjs = a;
    }
};