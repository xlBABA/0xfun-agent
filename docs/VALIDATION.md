# v1.1.0 packaging validation

## Executed successfully

- **macOS, Node 24.11.1:** build, all **17 tests**, distribution checks, and installation of a real command into a separate prefix whose path contains spaces.
- **Linux, Node 22.19.0 / npm 10.9.3:** clean source copied into an official Node Debian container without host dependencies or generated runtime files; `npm ci --ignore-scripts`, build, all **17 tests**, distribution checks, and installed-command smoke test passed.
- **Clean-source installation:** reinstalled from source without copying `node_modules` or `.runtime`; installed command returned `0xfun v1.1.0` without a separate globally installed agent or an alias.
- **Real terminal smoke test on macOS:** 100×24 terminal, animated skull, 0xfun title, release label, selected fixture model, and `~/Downloads` directory label; no resource lists, duplicate-skill warnings, or unsolicited package welcome message. Animation produced 20 distinct rendered/color states.
- **Model transport and child processes:** real agent turns against a local HTTP/SSE fixture, plus an actual subagent launch using the same isolated profile and model. No paid provider request or real API key was used.
- **Resource baseline:** 35 skills, seven prompt templates, all six extension tools, and the existing audit/subagent commands loaded without errors or conflicts. Explicit private product skills can be added; unrelated shared host skills do not enter the default baseline.
- **Original work preserved:** the original local AGENTS.md snapshot is retained at `docs/AGENTS.original-local.md`; the active AGENTS.md keeps the existing GitHub edition's additional evidence/action rules. The home-directory original is untouched. The three pinned integration packages' source files were compared with the existing installation: 165 subagent, 54 research, and 221 audit source/reference files had no differences. All 179 runtime JavaScript files also matched the original installed version.
- **Distribution checks:** 172 resource/license checksums verified; dependency versions pinned; private state directories and restricted synced skill contents excluded; npm package dry-run contained no credentials, sessions, environment files, or dependency directories.

The suite also checks 1–200-column rendering, model updates, symlinked-home/junction path handling, timer cleanup, concurrent builds, cache invalidation, user-setting preservation, partial settings, checkout moves, valid RPC JSONL, and branded help/version output.

## CI activation pending

The supplied `docs/ci-workflow.yml` template covers `ubuntu-latest`, `macos-latest`, and `windows-latest`, each with Node 22.19.0 and 24.11.1. It is not an active GitHub workflow until a maintainer with workflow-write permission installs it at `.github/workflows/ci.yml`. The publication credential can push application code but does not grant that separate permission. **Native Windows behavior and the hosted matrix are therefore not claimed as verified here.** See PUBLISHING.md for activation steps.

## Remaining maintainer steps

1. Activate the workflow using appropriately authorized GitHub credentials.
2. Confirm all hosted CI jobs pass before advertising Windows CI as green.
3. Try the documented installation from a fresh account/profile with your own model access.

The verified repository target is https://github.com/xlBABA/0xfun-agent. Publication commits and release tags are recorded in Git history. No credentials, sessions, or private host-app skills are shipped. The author's existing working launcher/profile are left intact. This validation is functional packaging verification, not a complete security audit of every third-party dependency or a guarantee of future provider/model availability.
