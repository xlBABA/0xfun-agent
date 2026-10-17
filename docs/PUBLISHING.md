# Maintain and publish 0xfun

Repository: **https://github.com/xlBABA/0xfun-agent**. The existing `main` history, original submodule declaration, and legacy CTF-skills gitlink are preserved. Do not force-push or overwrite existing release tags.

## Verify a release

```bash
npm ci --ignore-scripts
npm run build
npm test
npm run check
npm pack --dry-run
```

Review `git status --short` and staged changes. `node_modules/`, `.runtime/`, credentials, session state, environment files, and personal configuration must not be committed. Restricted synced skills are intentionally excluded; see DISTRIBUTION.md and THIRD_PARTY_NOTICES.md.

## Publish application changes

```bash
git add .
git diff --cached --stat
git commit -m "Update 0xfun"
git push origin main
```

Use your normal GitHub credential manager or interactive GitHub CLI authentication. Never put a personal access token in a remote URL, source file, shell history, or document. For this initial publication, the Actions workflow is intentionally supplied as a non-executing template because the provided credential lacks the separate workflow-write permission.

Before a new release, update the package version, banner label, profile changelog version, lockfile, and CHANGELOG together. Create a new tag only if it does not already exist:

```bash
git tag v1.1.0
git push origin v1.1.0
```

If that tag already exists, do not recreate or move it. Use a new version for a changed release.

## Activate cross-platform CI

The complete workflow template is committed at **`docs/ci-workflow.yml`**. It is inactive there: GitHub only runs workflow files under `.github/workflows/`.

A classic GitHub PAT needs the `workflow` scope in addition to repository write access to create/update that protected path. A fine-grained credential needs the applicable **Workflows: write** permission. Do not bypass this permission boundary or paste another token into public files/chat; use an appropriately authorized credential through a secure credential manager, GitHub CLI login, or GitHub's authenticated web editor.

Once authorized:

```bash
mkdir -p .github/workflows
cp docs/ci-workflow.yml .github/workflows/ci.yml
git add -f .github/workflows/ci.yml
git commit -m "Enable cross-platform installation and runtime CI"
git push origin main
```

`-f` only overrides a local ignore rule that protects the initial publishing workspace; it does not bypass GitHub permissions. New clones do not need that local rule. In the original publishing workspace, remove the matching `.git/info/exclude` entry once workflow access is available.

Wait for the six Linux/macOS/Windows and Node-version jobs to finish. Only report Windows or hosted CI as verified after seeing successful results. Keep workflow permissions minimal (`contents: read`); the template does not need the publisher's PAT.

## Verify a fresh installation

From a new directory:

```bash
git clone --branch v1.1.0 https://github.com/xlBABA/0xfun-agent.git 0xfun && cd 0xfun
npm ci --ignore-scripts && npm run setup
OXFUN_HOME="$HOME/.0xfun-clean-test" 0xfun doctor
OXFUN_HOME="$HOME/.0xfun-clean-test" 0xfun
```

Use your own model account. Confirm the skull/header, skills/prompts, a model response, and an isolated session. New users must never receive the author's credentials or conversations. The legacy skills submodule is not required for the new distribution's active profile.

## Maintaining snapshots and credits

If bundled resources change, regenerate inventory hashes with `node scripts/inventory.mjs --write`, review the diff, and rerun the checks. Do not bless unexplained changes. Dependency upgrades require updating the shrinkwrap and testing runtime/child-process compatibility.

Keep required upstream license texts and technical provenance. Normal user-facing branding is 0xfun, not a claim that every third-party component was authored by this project.
