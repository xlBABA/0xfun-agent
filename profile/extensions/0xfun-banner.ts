/** 0xfun's startup UI. Presentation only: tools, skills, and prompts stay loaded. */
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth, type Component, type TUI } from "@earendil-works/pi-tui";

// Deliberate pauses between frames: 18 × 250 ms = 4.5 seconds, without blocking chat.
const FRAME_MS = 250;
const FRAME_COUNT = 18;
const AGENT_VERSION = "v1.1";

type StartupInfo = { model: string; directory: string };

function formatDirectory(cwd: string): string {
	const canonical = (path: string) => {
		try { return realpathSync.native(path); } catch { return path; }
	};
	// cwd may resolve symlinks/junctions that HOME still contains (for example
	// /var -> /private/var on macOS). Compare canonical paths before shortening.
	const fromHome = relative(canonical(homedir()), canonical(cwd));
	if (!fromHome) return "~";
	return fromHome !== ".." && !fromHome.startsWith(".." + sep) && !isAbsolute(fromHome)
		? join("~", fromHome) : cwd;
}

const SKULL = [
	"       .----------.       ",
	"     .'            '.     ",
	"    /                \\    ",
	"   /                  \\   ",
	"  |    .--.    .--.    |  ",
	"  |   ( @@ )  ( @@ )   |  ",
	"  |    '--' /\\ '--'    |  ",
	"   \\       /__\\      /   ",
	"    '._   .----.  _.'    ",
	"       |  | || |  |      ",
	"       |  |_||_|  |      ",
	"        '--------'       ",
];

const SMALL_SKULL = [
	"   .----.   ",
	"  /      \\  ",
	" | @@  @@ | ",
	" |   /\\   | ",
	"  \\  --  /  ",
	"   ||||||   ",
	"   '----'   ",
];

// Five-row pixel lettering, deliberately lowercase: 0xfun.
const LETTERS = [
	[" ███ ", "██ ██", "██ ██", "██ ██", " ███ "],
	["     ", "██ ██", " ███ ", "██ ██", "     "],
	[" ████", "██   ", "████ ", "██   ", "██   "],
	["     ", "██ ██", "██ ██", "██ ██", " ████"],
	["     ", "████ ", "██ ██", "██ ██", "██ ██"],
];
const LOGO = Array.from({ length: 5 }, (_, row) => LETTERS.map((letter) => letter[row]).join("  "));

class SkullHeader implements Component {
	private frame: number;
	private timer: ReturnType<typeof setInterval> | undefined;

	constructor(
		private readonly tui: TUI,
		private readonly theme: Theme,
		animate: boolean,
		private readonly info: StartupInfo,
		private readonly onReady: () => void,
	) {
		this.frame = animate ? 0 : FRAME_COUNT;
		if (animate) {
			this.timer = setInterval(() => {
				this.frame++;
				if (this.frame >= FRAME_COUNT) {
					this.dispose();
					this.onReady();
				}
				this.tui.requestRender();
			}, FRAME_MS);
			this.timer.unref();
		}
	}

	render(width: number): string[] {
		if (width <= 0) return [];
		const logoWidth = visibleWidth(LOGO[0]);
		const skullWidth = Math.max(...SKULL.map(visibleWidth));
		const horizontal = width >= skullWidth + logoWidth + 4;
		const skull = horizontal ? SKULL : SMALL_SKULL;
		const blinking = this.frame === 7 || this.frame === 8;
		const scanning = this.frame < skull.length;

		const skullLines = skull.map((line, row) => {
			const color = scanning && row > this.frame ? "dim" : "accent";
			return line.split("@@").map((part) => this.theme.fg(color, part)).join(
				this.theme.bold(this.theme.fg(blinking ? "muted" : "text", blinking ? "--" : "@@")),
			);
		});
		const logoLines = (width >= logoWidth ? LOGO : ["0xfun"])
			.map((line) => this.theme.bold(this.theme.fg("accent", line)));

		let lines: string[];
		if (horizontal) {
			const top = Math.floor((skull.length - logoLines.length) / 2);
			lines = skullLines.map((line, row) =>
				line + " ".repeat(skullWidth - visibleWidth(line) + 4) + (logoLines[row - top] ?? ""),
			);
		} else {
			const blockWidth = Math.max(...skull.map(visibleWidth), ...logoLines.map(visibleWidth));
			const pad = (line: string) => " ".repeat(Math.floor((blockWidth - visibleWidth(line)) / 2)) + line;
			lines = [...skullLines.map(pad), "", ...logoLines.map(pad)];
		}

		const blockWidth = Math.max(...lines.map(visibleWidth));
		const indent = " ".repeat(Math.max(0, Math.floor((width - blockWidth) / 2)));
		const infoLines = [
			this.theme.bold(this.theme.fg("accent", `${width >= 22 ? "0xfun " : ""}${AGENT_VERSION} · CTF agent`)),
			this.theme.fg("muted", "Model: ") + this.theme.fg("text", this.info.model),
			this.theme.fg("muted", "Dir:   ") + this.theme.fg("text", this.info.directory),
			this.theme.fg("dim", width >= 35 ? "Type to chat · /banner to replay" : "Type to chat"),
		];
		const infoWidth = Math.min(width, Math.max(...infoLines.map(visibleWidth)));
		const infoIndent = " ".repeat(Math.floor((width - infoWidth) / 2));
		return [
			"",
			...lines.map((line) => truncateToWidth(indent + line, width, "")),
			"",
			...infoLines.map((line) => truncateToWidth(infoIndent + line, width)),
			"",
		];
	}

	setModel(model: string): void {
		if (model === this.info.model) return;
		this.info.model = model;
		this.tui.requestRender();
	}

	invalidate(): void {
		// Colors are computed during render, so theme changes need no cached state.
	}

	dispose(): void {
		if (this.timer) clearInterval(this.timer);
		this.timer = undefined;
	}
}

export default function (pi: ExtensionAPI) {
	let header: SkullHeader | undefined;
	let titleTimer: ReturnType<typeof setTimeout> | undefined;

	const cleanup = () => {
		header?.dispose();
		header = undefined;
		if (titleTimer) clearTimeout(titleTimer);
		titleTimer = undefined;
	};

	const install = (ctx: ExtensionContext, animate: boolean) => {
		if (ctx.mode !== "tui") return;
		cleanup();
		ctx.ui.setFooter(() => ({ render: () => [], invalidate() {} }));
		ctx.ui.setHeader((tui, theme) => {
			header = new SkullHeader(tui, theme, animate, {
				model: ctx.model?.id ?? "No model selected",
				directory: formatDirectory(ctx.cwd),
			}, () => ctx.ui.setTitle("0xfun"));
			return header;
		});
		// Pi sets its own title at the end of rebinding; apply the brand after that.
		titleTimer = setTimeout(() => ctx.ui.setTitle("0xfun"), 100);
		titleTimer.unref();
	};

	pi.on("session_start", (event, ctx) => install(ctx, event.reason === "startup"));
	pi.on("model_select", (event, ctx) => {
		if (ctx.mode === "tui") header?.setModel(event.model.id);
	});
	pi.on("session_shutdown", cleanup);

	pi.registerCommand("banner", {
		description: "Replay the 0xfun skull animation",
		handler: async (_args, ctx) => install(ctx, true),
	});

	pi.registerCommand("builtin-header", {
		description: "Restore the built-in header and status footer",
		handler: async (_args, ctx) => {
			if (ctx.mode !== "tui") return;
			cleanup();
			ctx.ui.setHeader(undefined);
			ctx.ui.setFooter(undefined);
		},
	});
}
