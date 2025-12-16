import { _Proxy, _Reflect, hook } from '@portal-solutions/hooker-core'
export async function shared_worker_boot(loader: string, r: Request): Promise<Response> {
    let url = new URL(r.url);
    let q = url.searchParams.get("url");
    if (q === null) {
        return new Response(loader);
    } else {
        let t = url.searchParams.get("type") || "classic";
        let loader = r.url.split("?")[0];
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