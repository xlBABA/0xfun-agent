/** Keep all Piolium functionality, without its unsolicited welcome notification. */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import piolium from "../../node_modules/@vigolium/piolium/extensions/piolium/index.ts";
import { PIOLIUM_STARTUP_HINT } from "../../node_modules/@vigolium/piolium/extensions/piolium/help.ts";

export default function (pi: ExtensionAPI) {
	// Adapt the package through the public API rather than patching node_modules.
	const quietApi = new Proxy(pi, {
		get(target, key, receiver) {
			if (key !== "on") return Reflect.get(target, key, receiver);
			return (event: string, handler: (event: unknown, ctx: ExtensionContext) => unknown) => {
				if (event !== "session_start") return Reflect.apply(target.on, target, [event, handler]);
				target.on("session_start", (event, ctx) => {
					if (ctx.mode !== "tui") return handler(event, ctx) as Promise<void> | void;
					const ui = new Proxy(ctx.ui, {
						get(target, key, receiver) {
							if (key !== "notify") return Reflect.get(target, key, receiver);
							return (message: string, level?: "info" | "warning" | "error") => {
								if (message === PIOLIUM_STARTUP_HINT && (!level || level === "info")) return;
								target.notify(message, level);
							};
						},
					});
					const quietContext = new Proxy(ctx, {
						get(target, key, receiver) {
							return key === "ui" ? ui : Reflect.get(target, key, receiver);
						},
					});
					return handler(event, quietContext) as Promise<void> | void;
				});
			};
		},
	});
	return piolium(quietApi);
}
