/** Brand the default agent introduction without changing tools or user prompts. */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DEFAULT_INTRO = "You are an expert coding assistant operating inside pi, a coding agent harness.";

export default function (agent: ExtensionAPI) {
	agent.on("before_agent_start", (event) => {
		const systemPrompt = event.systemPrompt.replace(DEFAULT_INTRO,
			"You are 0xfun, a CTF-focused terminal coding agent.");
		if (systemPrompt !== event.systemPrompt) return { systemPrompt };
	});
}
