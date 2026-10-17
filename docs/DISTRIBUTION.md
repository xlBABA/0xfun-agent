# Distribution scope

## Included from the existing setup

The root `AGENTS.md` retains the existing repository's CTF operating-instructions edition, including its additional bias-to-action, evidence-status, and stuck-loop rules. The original local operating-instructions snapshot is also preserved at `docs/AGENTS.original-local.md`; the author's home-directory file is not changed. All fourteen portable, openly licensed top-level skill directories were copied with their Markdown references: eleven CTF/triage skills, skill discovery, and two database-development skills. The exact shipped files are recorded by SHA-256 in `profile/inventory.json`.

The original `.gitmodules` and `skills/ctf-skills` gitlink are retained for repository history/backward compatibility. The active distribution uses the complete copied `profile/skills/` snapshots, so a recursive/submodule clone is not required to run the agent.

The three extension integrations are installed at their exact original versions through `npm-shrinkwrap.json`. Their own shipped prompts, skills, and resources are registered by the distribution manifest, rather than copied from or loaded out of the author's home directory. One managed package path connects the installed profile to the checkout. Shared global `~/.agents/skills/` auto-discovery is excluded by default, while additions in the product's own private skill directory remain available. This prevents duplicate/restricted host skills from changing the fresh-install baseline.

The same pink theme and current skull/banner customization are included. Normal startup is quiet, with live model/directory information, release v1.1, and a finite 4.5-second animation. It does not display loaded resource lists or the default status footer.

## Excluded from public source

The following synced skill names are not shipped: `built-in-browser`, `chrome-browser`, `computer-use`, `deep-research`, `docs`, `docx`, `google-workspace`, `import-memory`, `learn`, `morning`, `pdf`, `pptx`, `skill-creator`, and `xlsx`.

Some explicitly prohibit redistribution under their proprietary licenses. Others lack a verified public grant or depend on account-bound desktop connectors. The terminal agent does not provide those connectors. Do not copy these private folders into the repository to make the skill count match the author's host application.

Authentication files, browser state, sessions, model caches, shell dotfiles, downloaded platform binaries, installed dependency folders, and private CTF artifacts are also excluded. Users must authenticate with their own accounts and install any external analysis tools they need.

## What “same version” means

Cloning the same commit and running `npm ci --ignore-scripts` installs the pinned application dependencies and the exact bundled resource snapshot. The lock records integrity hashes. It does not reproduce provider-side behavior, account entitlements, model catalogs that have been explicitly refreshed, or a user's private preferences and custom extensions.

`main` is a moving reference. Use a release tag or full commit SHA to reproduce an older release. The default model preference is preserved from the author's setup, but users must choose an available model if their account/catalog does not contain it.

## Development boundaries

The repository does not replace the author's working local launcher or touch the existing private profile. The new installed distribution defaults to `~/.0xfun/agent/`, keeping public distribution resources separate from pre-existing user configuration. `OXFUN_HOME` provides a fully separate profile for testing. Never put it inside a public checkout without understanding the ignore rules.

The runtime and integration versions are intentionally frozen. Updating a dependency requires rebuilding, updating the lock, rerunning runtime/child-process/resource tests, and reviewing upstream license and compatibility changes. The audit package's old peer range is explicitly overridden to the working runtime version rather than letting npm install a second incompatible runtime.
