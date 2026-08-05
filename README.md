# pi CTF Agent

A Capture-The-Flag agent configuration for [pi](https://github.com/earendil-works/pi-coding-agent),
the terminal coding agent. Drop this into your pi agent directory and pi becomes an
autonomous CTF player: it enumerates targets, classifies the vuln class, loads the
matching skill from the bundled [ctf-skills](https://github.com/ljagiello/ctf-skills)
pack, forms one evidence-backed hypothesis, and attacks the target in a tight loop
until it prints the flag.

## What's inside

| Path | Purpose |
|------|---------|
| `AGENTS.md` | The operating loop: enumerate → classify → load skill → hypothesize → test → iterate. Includes rules of engagement, checkpoint/resume protocol, and the "when stuck" recovery procedure. |
| `skills/ctf-skills` | Git submodule of [`ljagiello/ctf-skills`](https://github.com/ljagiello/ctf-skills) — deep technique catalogs for web, pwn, reverse, crypto, forensics, OSINT, malware, AI/ML, misc, plus a writeup generator. |

## Install

```bash
# 1. install pi
npm install -g @earendil-works/pi-coding-agent

# 2. clone this repo (with the skills submodule) into pi's agent directory
git clone --recurse-submodules https://github.com/xlBABA/pi-ctf-agent.git /tmp/pi-ctf-agent
cp /tmp/pi-ctf-agent/AGENTS.md ~/.pi/agent/AGENTS.md
mkdir -p ~/.pi/agent/skills
cp -r /tmp/pi-ctf-agent/skills/ctf-skills ~/.pi/agent/skills/

# 3. configure your model provider (pick one)
#    https://github.com/earendil-works/pi-coding-agent#setup
pi   # then run a challenge
```

Already have pi set up? Just copy `AGENTS.md` and the `skills/` folder into
`~/.pi/agent/` — that's the entire agent.

## Usage

Point pi at an authorized CTF target, e.g.:

```
Challenge: sql Map1
Category: web
Target: http://target.example:8080/
Flag format: picoCTF{}
Task: Solve this challenge and print the flag on its own line.
```

The agent keeps a `checkpoint.md` in the challenge working directory so any fresh
session can resume mid-solve.

## ⚠️ Authorization

Only run this against targets you are explicitly allowed to test (CTF competitions,
labs, your own infrastructure). The agent performs real exploitation.

## Never commit these

If you copy files *out* of `~/.pi/agent/` instead of cloning this repo, note that
directory also contains private state. The `.gitignore` here blocks the lot:

- `auth.json` — API keys / provider tokens
- `models-store.json`, `settings.json` — local config
- `sessions/`, `npm/`, `bin/` — session logs and local installs

## License

`AGENTS.md` and this README: use as you like. `skills/ctf-skills` is licensed
separately — see its [LICENSE](https://github.com/ljagiello/ctf-skills/blob/main/LICENSE).
