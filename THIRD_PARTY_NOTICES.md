# Third-party notices

0xfun is a branded distribution and configuration of open-source components, not a claim to have authored every underlying implementation. The ordinary command and interface are branded 0xfun. The following technical acknowledgments and license notices are intentionally retained.

| Component | Pinned source / version | License |
| --- | --- | --- |
| Runtime, model adapters, agent core, terminal UI | `@earendil-works/pi-coding-agent`, `pi-ai`, `pi-agent-core`, `pi-tui` **0.82.1**, [upstream](https://github.com/earendil-works/pi) | MIT; Mario Zechner and contributors; `licenses/runtime-MIT.txt` |
| Multi-agent integration | `pi-subagents` **0.37.2**, [upstream](https://github.com/nicobailon/pi-subagents) | MIT, as declared in the package manifest; the installed package metadata/source retains its notices |
| Web research | `pi-web-access` **0.18.0**, [upstream](https://github.com/nicobailon/pi-web-access) | MIT; `licenses/web-access-MIT.txt` |
| Audit workflows, prompts, specialist skills | `@vigolium/piolium` **0.0.13**, [upstream](https://github.com/vigolium/piolium) | MIT; `licenses/audit-workflows-MIT.txt` |
| CTF skill references | [ljagiello/ctf-skills](https://github.com/ljagiello/ctf-skills), snapshot `d19f35fd3dd2e126108752aee84c657c888126d3` plus the locally installed snapshots recorded in the inventory | MIT, Copyright (c) 2026 Lukasz Jagiello; `licenses/ctf-skills-MIT.txt` |
| Skill discovery instructions | [vercel-labs/skills](https://github.com/vercel-labs/skills), locally installed `find-skills` snapshot | MIT, Vercel, Inc.; `licenses/find-skills-MIT.txt` |
| Database skills | [supabase/agent-skills](https://github.com/supabase/agent-skills), installed `supabase` and `supabase-postgres-best-practices` snapshots | MIT, Supabase; `licenses/database-skills-MIT.txt` |
| Schemas and other dependencies | `typebox` **1.1.38** and all transitive packages in `npm-shrinkwrap.json` | See the corresponding installed package licenses |

The build copies the pinned runtime's distributed JavaScript, documentation, and assets to `.runtime/`, preserving its source maps and license. It uses the runtime's supported `piConfig.name` and `piConfig.configDir` fields for branding and private configuration isolation. The original dependency installation is not patched. Internal package identities, tool protocols, and audit command names remain intact for compatibility.

The Piolium adapter only suppresses its exact unsolicited informational welcome notification in the terminal; other notices, warnings, tools, and commands are preserved. Its package-internal import paths are tested against the pinned release. Review compatibility before changing that dependency version.

The CTF web3 reference had one portability-only change: an author's absolute Foundry path was replaced with `$HOME/.foundry/bin`. Resource checksums in `profile/inventory.json` describe the actual distributed snapshot.

## Material not redistributed

The author's machine also has synced desktop/browser, document, and host-integration skills. Several carry proprietary terms explicitly prohibiting reproduction or redistribution, and others have no independently verified redistribution grant or require host-only connectors. They are **not** included in this public distribution. This exclusion does not remove or modify them on the author's machine. No proprietary license text or proprietary skill contents are copied into this repository.

Personal credentials, OAuth tokens, browser cookies, private sessions, model caches, local binary tools, and challenge data are not distribution resources and must never be committed.
