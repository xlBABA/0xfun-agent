# 0xfun

**v1.1 · A CTF-focused terminal agent.**

An animated skull, a clean chat interface, and a practical collection of CTF skills, web research tools, and multi-agent workflows. Run it as **`0xfun`**—no aliases and no separately installed agent command.

```text
0xfun v1.1 · CTF agent
Model: your active model
Dir:   ~/Downloads
Type to chat · /banner to replay
```

## Requirements

- **Node.js 22.19.0 or newer**. Node **24.11.1** is the reference version for this release. npm is included with Node.
- **Git** and **Bash**. macOS and most Linux distributions already include Bash. On Windows, install **Git for Windows** and use Git Bash, or use WSL2.
- Internet access for the initial dependency install, first-run helper downloads, model authentication, and online tools.
- Your own supported model subscription or API key. **No account, API key, or paid model access is included.**

Check your prerequisites:

```bash
node --version
npm --version
git --version
bash --version
```

The agent can read and change files and execute commands with your user's permissions. Do not run it as root. Use it only for authorized CTFs, labs, and assessments; use a VM/container for untrusted challenge files.

## Install: macOS, Linux, or Windows Git Bash

> Official source: **[xlBABA/0xfun-agent](https://github.com/xlBABA/0xfun-agent)**. This distribution is not published to npm; do not use `npm install -g 0xfun` from the public registry.

From Bash, these same two commands work on all three systems once the prerequisites are installed:

```bash
git clone --branch main https://github.com/xlBABA/0xfun-agent.git 0xfun && cd 0xfun
npm ci --ignore-scripts && npm run setup
```

Then:

```bash
0xfun
```

`setup` prepares the pinned runtime and uses npm to install a real command shim in your npm global prefix. It does not add an alias, copy anyone's credentials, or overwrite another agent's configuration. **Keep the checkout:** the command links to that directory.

To run without installing a global command:

```bash
npm ci --ignore-scripts
npm run setup -- --no-link
node bin/0xfun.mjs
```

### Exact release / reproducible installation

`main` installs the current main-branch commit. For the exact v1.1 release, check out its tag before installing (the maintainer must publish the tag first):

```bash
git clone --branch v1.1.0 https://github.com/xlBABA/0xfun-agent.git 0xfun && cd 0xfun
npm ci --ignore-scripts && npm run setup
```

For a specific revision, use `git checkout <full-commit-SHA>` before `npm ci`. `npm-shrinkwrap.json` pins the complete dependency graph, and `profile/inventory.json` records the bundled resource checksums. This reproduces the application/profile version—not another user's credentials, sessions, external tools, model availability, or nondeterministic model responses.

### macOS prerequisites

Install Node.js from [nodejs.org](https://nodejs.org/) or your existing Node version manager. If Git is missing, run `xcode-select --install`. A Node version manager avoids global npm permission problems. The pink theme works best in a UTF-8 terminal such as Terminal, iTerm2, or Ghostty.

### Linux prerequisites

Install a current Node.js release with your preferred version manager or the official distribution. Some distribution packages provide an older Node release; verify `node --version`. Install `git` and `bash` using your distribution's package manager if they are missing.

### Windows prerequisites and setup

**For native Windows:** install current Node.js and [Git for Windows](https://git-scm.com/download/win). Open a **new Git Bash** window, then use the two install commands above. Windows Terminal is recommended.

Optional prerequisite installation from PowerShell, if `winget` is available:

```powershell
winget install --id OpenJS.NodeJS.LTS --exact
winget install --id Git.Git --exact
```

Or install from PowerShell (including Windows PowerShell 5.1):

```powershell
git clone --branch main https://github.com/xlBABA/0xfun-agent.git 0xfun
Set-Location 0xfun
npm.cmd ci --ignore-scripts
npm.cmd run setup
0xfun.cmd
```

Use the `.cmd` commands if PowerShell blocks npm's `.ps1` shims. Do not disable your execution policy just to run the agent. Bash must still be installed for the command-execution tool.

**For Linux-oriented CTF work on Windows:** WSL2 is recommended, especially for GDB, pwntools, ELF binaries, and other Linux-only tooling. Install Node/Git and 0xfun **inside WSL**, and work in a Linux directory such as `~/ctf`. A native Windows install and a WSL install use separate configuration and dependencies.

## First run: connect your model

Start `0xfun`, then enter:

```text
/login
/model
```

Choose a provider you have access to and complete its authentication flow. The profile preserves the author's preferred default (`openai-codex`, `gpt-6.1-sol`, maximum reasoning), but **that model may not be available to your account or the bundled catalog**. Select any supported model you can use with `/model`; a fallback/missing-model notice is not an installation failure. The header always displays the model actually selected.

You can also use an API key for a supported provider. For example, in Bash:

```bash
export OPENAI_API_KEY="your-own-key"
0xfun --provider openai --model gpt-4o
```

Use a model your provider currently offers. Do not paste real keys into tracked files or commit them. Credentials saved through `/login` stay in your private configuration directory. API usage and subagents can incur provider charges.

## Everyday use

```bash
0xfun                              # Interactive chat
0xfun "Inspect this challenge"     # Start with a task
0xfun --continue                   # Continue the latest session
0xfun -p "Summarize this source"    # Print one response and exit
0xfun --provider NAME --model ID    # Choose a model for this run
0xfun --mode rpc                    # JSONL integration mode
0xfun doctor                       # Verify prerequisites and pinned versions
0xfun paths                        # Show configuration/session locations
0xfun --version                    # 0xfun v1.1.0
0xfun --help                        # Branded command help
0xfun --help --all                  # Full advanced runtime options
```

Useful chat commands:

| Command | Purpose |
| --- | --- |
| `/banner` | Replay the 4.5-second skull animation |
| `/model` | Select the active model; the header updates immediately |
| `/login`, `/logout` | Manage your own provider authentication |
| `/new`, `/resume` | Start a new session or open a saved one |
| `/settings` | Change theme, reasoning, and other preferences |
| `/skill:solve-challenge` | Use the challenge triage workflow |
| `/hotkeys` | Show keyboard shortcuts |
| `/quit` | Exit |

Type `/` and use completion to discover the bundled skills, prompt templates, research tools, audit commands, and subagent workflows. Ctrl+C interrupts/clears; Ctrl+D exits an empty editor.

## What's included

- Your **AGENTS.md** CTF operating loop, including flag verification, per-challenge checkpoints, and the additional evidence/action rules already present in this repository. The original local edition is preserved in `docs/AGENTS.original-local.md`.
- The complete portable CTF skill directories and their reference files: AI/ML, crypto, forensics, malware, misc, OSINT, pwn, reverse, web, writeups, and challenge triage.
- Skill discovery and the two database-development skills from the current open-source profile.
- The same pinned web-research, subagent, and security-audit integrations, including their distributed skills and prompt templates.
- The pink theme, animated skull, large wordmark, live model, directory, and release label.

The exact resource inventory and dependency versions are in `profile/inventory.json` and `package.json`. Technical third-party attribution is in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

**Intentionally excluded:** accounts, tokens, cookies, session history, model caches, machine-specific binaries, private challenge files, duplicate skill copies, and proprietary desktop/document skills whose licenses do not permit redistribution. Some excluded skills also require host-application connectors unavailable in a normal terminal. See [distribution notes](docs/DISTRIBUTION.md). Your existing private setup is not deleted or changed.

Skills are instructions and references, **not an installation of every security tool**. Install tools such as Python, GDB, pwntools, nmap, ffmpeg, browser tooling, or platform-specific SDKs separately when a challenge needs them. Some web-search backends require their own credentials; ordinary page fetching does not imply a paid search subscription. No MCP/browser/desktop connector access is supplied automatically.

## Configuration and privacy

By default, private state is stored outside the checkout:

```text
~/.0xfun/agent/
├── settings.json          # Your model, theme, and package preferences
├── AGENTS.md              # Seeded CTF instructions; yours to edit
├── APPEND_SYSTEM.md       # Product identity and local conventions
├── auth.json              # Your credentials — never commit this
├── models.json            # Optional custom providers/models
├── web-search.json        # Optional research configuration
├── extensions/            # Your additional extensions
├── skills/                # Your additional skills
└── sessions/              # Your conversations — never commit these
```

A first run seeds the non-secret defaults and registers this checkout's bundled profile. Subsequent starts preserve user model/theme settings and edited instruction files. Moving the checkout and launching its new path updates the managed package path; if the installed command is broken after a move, rerun `npm run setup` in the new directory.

The shared global `~/.agents/skills/` directory is excluded by default, so unrelated host-application skills and duplicate copies do not leak into a fresh 0xfun profile. Put your own additions in `~/.0xfun/agent/skills/`. You can deliberately enable shared global skills by removing the `!**/.agents/skills/**` exclusion from your private `settings.json`; that changes the baseline inventory.

Project-specific resources can live in `<project>/.0xfun/`, and project `AGENTS.md` files are loaded as additional instructions. Review project trust prompts before loading unfamiliar project extensions. Extensions run with your user's permissions.

Public environment variables:

| Variable | Purpose |
| --- | --- |
| `OXFUN_HOME` | An absolute path replacing `~/.0xfun`; useful for an isolated profile |
| `OXFUN_SESSION_DIR` | Override session storage |
| `OXFUN_STARTUP_CHECKS=1` | Opt into upstream startup checks; off by default to keep the splash quiet |

For example:

```bash
OXFUN_HOME="$HOME/.0xfun-lab" 0xfun
```

Startup update checks, telemetry, and automatic catalog refresh are disabled by default. **This is not a network sandbox:** model requests, research, first-run helper downloads, and explicitly requested operations may use the network. Refresh model catalogs explicitly with `0xfun update --models`.

The profile uses third-party components that may retain technical command names and on-disk report formats. The launch command and normal chat branding are 0xfun; see the notices for provenance rather than treating the project as an original implementation of every dependency.

## Updating

From your checkout:

```bash
git pull --ff-only
npm ci --ignore-scripts && npm run setup
```

Use `git checkout <tag-or-commit>` first if you want a fixed release rather than the latest main. `0xfun update` prints these instructions instead of silently replacing pinned application dependencies. Only `0xfun update --models` performs a model-catalog refresh.

## Troubleshooting

### `0xfun: command not found` / an old alias still launches

Run `npm run setup` again. Check `npm prefix -g`. On macOS/Linux, commands are in `<prefix>/bin`; on Windows, they are directly in `<prefix>`. Add that directory to PATH and open a new terminal. If you previously made an alias, remove it with `unalias 0xfun` and remove its definition from your shell configuration. The installed command itself does not need an alias.

To check which command runs, use `command -v 0xfun` in Bash or `Get-Command 0xfun` in PowerShell. If an older development launcher is first on PATH, back up/rename that specific old launcher, then run `hash -r` or open a new terminal. Do not delete the new checkout or its npm command shim. You can always use `node /path/to/0xfun/bin/0xfun.mjs`.

### npm permission errors (macOS/Linux)

Prefer a Node version manager, or install the command into a user-owned prefix:

```bash
npm run setup -- --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
```

Add that `export` line to `~/.bashrc`, `~/.zshrc`, or your shell's startup file to persist it. Do not use `sudo npm` for this setup.

On Windows, use a user-owned prefix such as `"$HOME/.0xfun-command"` in Git Bash, or `"$env:USERPROFILE\.0xfun-command"` in PowerShell. Add that **prefix itself** to your user PATH (Windows does not add a `bin` subdirectory), then open a new terminal.

### Dependencies or Bash are missing

Run `0xfun doctor`. Reinstall the exact dependencies with `npm ci --ignore-scripts`. Install Git Bash on Windows, or Bash on Linux. For an unusual Windows Bash location, set `shellPath` in your private `settings.json`.

### Native module / architecture errors

Do not copy `node_modules` from another computer or from Windows into WSL. Remove that dependency directory and run `npm ci --ignore-scripts` on the target operating system and architecture. Do not commit dependency folders or platform-specific helper binaries.

### First run has no usable model

Connect your own account with `/login` and select an available model with `/model`. Availability depends on the provider, account, region, and subscription; the application's preferred model name does not grant access to it.

## Development and checks

```bash
npm ci --ignore-scripts
npm run build
npm test
npm run check
```

The test suite does not need real API keys or paid model requests. Clean installation and all 17 tests have passed on macOS (Node 24.11.1) and Linux in Docker (Node 22.19.0). A six-job GitHub Actions matrix is supplied in `docs/ci-workflow.yml`; activating it under `.github/workflows/ci.yml` requires workflow-write permission. It is a template, not an active hosted workflow in this release. Native Windows and the hosted matrix have not yet run. See [validation details](docs/VALIDATION.md) and [CI activation](docs/PUBLISHING.md#activate-cross-platform-ci).

See [publishing instructions](docs/PUBLISHING.md) before the first GitHub push. Never upload your home configuration directory as the repository.

## Uninstall

Remove the npm command link with `npm uninstall -g 0xfun` (include the same `--prefix` if you used a custom one), then delete the checkout if no longer needed. This does not delete private state. Back up your sessions and credentials before manually removing `~/.0xfun` if you also want to erase them.

## License

The distribution's original glue code is MIT-licensed. Bundled third-party material keeps its own copyright and license. See [LICENSE](LICENSE), [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), and `licenses/`.
