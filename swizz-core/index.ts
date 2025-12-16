import { _Proxy, _Reflect, hook } from '@portal-solutions/hooker-core'
let old = navigator.serviceWorker.register.bind(navigator.serviceWorker);
let crx: ServiceWorkerRegistration | undefined = undefined;
let base = "";
let origin_ = location.origin;
export async function initCrxSW(a: string): Promise<void> {
    crx = await old(`/${a}/sw.js`, { scope: origin_ });
    base = a;
}
let all: WeakMap<ServiceWorkerRegistration, SharedWorker> = new WeakMap();
let ports: WeakMap<MessagePort, ServiceWorkerRegistration> = new WeakMap();
hook(ServiceWorkerContainer.prototype, 'register', Reflect => ({
    async apply(target, thisArg, argArray) {
        let a0 = argArray[0];
        let a1 = argArray[1] ?? {};
        a1 = {...a1};
        let scope = a1.scope ?? (new URL("./", a0).toString());
        if ('scope' in a1) {
            a1 = { ...a1 };
            delete a1.scope;
        }
        while (!crx?.active) {
            await new Promise(requestAnimationFrame);
        }
        let w = new SharedWorker(`/${base}/shared_worker_boot.js?url=${btoa(a0)}&type=${a1.type ?? 'classic'}`, a1);
        let a = crx.active!;
        a.postMessage({ load: a0, scope: a1, type: 'load_subserver', worker: w }, [w.port]);
        let proxy = new _Proxy(crx, {
            get(target, p, receiver) {
                if (p === 'active') {
                    let active = new _Proxy(w.port, {
                        get(target, p, receiver) {
                            if (p === 'scriptURL') {
                                return a0;
                            }
                            if (p === 'state') {
                                return 'activated';
                            }
                            return _Reflect.get(target, p, receiver);
                        },
                        getPrototypeOf(target) {
                            return _Reflect.getPrototypeOf(a);
                        },
                        setPrototypeOf(target, v) {
                            return true;
                        },
                    });
                    ports.set(active, proxy);
                    return active;
                }
                return _Reflect.get(target, p, receiver);
            },
        });
        all.set(proxy, w);
        return proxy;
    },
}));
