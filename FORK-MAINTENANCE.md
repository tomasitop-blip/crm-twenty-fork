# Fork maintenance runbook

This fork is the deployment source of truth. Upstream (`twentyhq/twenty`) is read-only
and is used only to pull in security fixes and bug fixes. Never push to upstream.

State as of 2026-11-20: `main` is at `3cdbacf52d`, **9 commits ahead** of upstream
(fork-owned changes) and **2533 commits behind** upstream. The gap is expected; see
[Syncing from upstream](#syncing-from-upstream).

## Remotes and authentication

```
origin    git@github.com:tomasitop-blip/crm-twenty-fork.git   # SSH, read/write
upstream  git@github.com:twentyhq/twenty.git                 # SSH, never write
```

Persistent routing from this VPS:

- `~/.ssh/config` pins `github.com` to the account-level key `~/.ssh/id_ed25519`
  (registered to `tomasitop-blip`, fingerprint `SHA256:WWkQIpOSX+9Agi20UYNadpmz+67OLWgy7NzH88X14us`).
  One account key covers every repo in that account — no per-repo deploy keys.
- All `tomasitop-blip` repos use SSH remotes. Plain `git push` / `git fetch` work.
- `tomasopbot1-hue` repos use HTTPS with a path-scoped credential helper
  (`credential.https://github.com/tomasopbot1-hue.helper` →
  `~/.local/bin/git-credential-gh-bot`), which reads the existing token from
  `~/.config/gh/hosts.yml`. GitHub allows an SSH key on only one account, and the bot's
  key is not on this VPS, so HTTPS is the write path for that account.
- The host-level `gh auth git-credential` helper for `github.com` was removed because
  it is read-only for `tomasitop-blip` and overrode the scoped bot helper.

Verify routing at any time:

```
printf 'protocol=https\nhost=github.com\npath=tomasopbot1-hue/vane.git\n\n' | git credential fill
git -C /home/tomas/repos/crm-twenty-fork push --dry-run origin main
```

## Branch model

- `main` — deploy branch. Every commit here is a candidate for the VPS image.
- `sync/upstream-YYYYMMDD` — short-lived branch for pulling upstream into the fork.
- `feature/<name>` — one fork-owned change per branch; keep commits small so syncs stay reviewable.

Fork-owned paths to expect conflicts in:

- `packages/twenty-apps/public/last-contact/**` (app source and version)
- `packages/twenty-server/src/engine/core-modules/i18n/locales/**` and
  `locales/generated/**` (synced from this fork's `origin/i18n` branch)
- AI model catalog changes from `origin/chore/ai-catalog-sync`
- `.github/workflows/fork-build-push.yml` and the `APP_VERSION` build arg

Per `CLAUDE.md`, do not hand-edit generated translation catalogs unless translations
are the actual task; regenerate them through the i18n pipeline instead.

## Syncing from upstream

A literal fast-forward is impossible while the fork has its own commits. Use a merge.

```
git fetch upstream
git switch -c sync/upstream-$(date +%Y%m%d)
git merge upstream/main
```

Resolve conflicts by keeping upstream's core code and reapplying only the fork-owned
changes listed above. Then verify before merging to `main`:

```
cd packages/twenty-apps/public/last-contact
node ../../../../.yarn/releases/yarn-4.13.0.cjs test
node ../../../../.yarn/releases/yarn-4.13.0.cjs typecheck

cd ../../../../
npx nx lint:diff-with-main twenty-server
cd packages/twenty-server && npx tsgo -p tsconfig.json --noEmit
```

For a large gap, do the merge once, build the image, and smoke-test the app before
pushing — do not split a single upstream sync across several `main` pushes, since each
push is a deploy candidate.

```
git switch main
git merge --no-ff sync/upstream-$(date +%Y%m%d)
git push git@github.com:tomasitop-blip/crm-twenty-fork.git main
git branch -d sync/upstream-$(date +%Y%m%d)
```

Cadence: at least monthly, and immediately when upstream ships a security advisory or a
dependency bump relevant to a deployed package. Track what is missing with:

```
git log --oneline main..upstream/main
git log --oneline main..upstream/main --grep='security\|chore(security)'
```

## Image and VPS deploy

The image is built from the fork by `.github/workflows/fork-build-push.yml`
(`packages/twenty-docker/twenty/Dockerfile`, target `twenty`, `linux/amd64`, `APP_VERSION`
from `package.json` + short sha). The VPS deployment lives in `/docker/twenty` and runs
`ghcr.io/tomasitop-blip/crm-twenty-fork:${TAG:-latest}` for `server` and `worker`.

**Normal (pipeline healthy):** push to `main`, wait for the workflow to go green, then:

```
cd /docker/twenty
docker compose pull
docker compose up -d
docker exec twenty-server-1 printenv APP_VERSION
curl -fsS http://localhost:3000/healthz
```

**Current fallback (pipeline down, Actions disabled and PAT lacks package scope):** build
locally on the VPS, then recreate only the Twenty services:

```
cd /home/tomas/repos/crm-twenty-fork
BASE=$(node -p "require('./package.json').version")
SHA=$(git rev-parse --short HEAD)
docker buildx build \
  --file packages/twenty-docker/twenty/Dockerfile \
  --target twenty --platform linux/amd64 \
  --build-arg "APP_VERSION=${BASE}+sha.${SHA}" \
  --tag ghcr.io/tomasitop-blip/crm-twenty-fork:latest \
  --load .
cd /docker/twenty && docker compose up -d
```

As of 2026-11-20 the GHCR pipeline is healthy again and `docker-compose.yml` is back to
`pull_policy: always`. The local-build procedure above is only a fallback for when
Actions or package publishing are broken; if you use it temporarily, switch
`pull_policy` to `never` while the local image is in place, then restore `always`.

Record the running digest before a redeploy so rollback is possible:

```
docker inspect twenty-server-1 --format '{{.Image}}'
```

## Marketplace apps (separate from the image)

The Docker image does **not** contain installable app source. Apps are npm artifacts
installed per workspace from the private marketplace. Rebuilding the image therefore
does not upgrade an app.

Publishing a new app version:

```
cd /home/tomas/repos/crm-twenty-fork/packages/twenty-apps/public/last-contact
YARN="node /home/tomas/repos/crm-twenty-fork/.yarn/releases/yarn-4.13.0.cjs"
$YARN twenty app:publish --private --remote production
```

The CLI prompts for an API key. Create it in Twenty under
**Settings → APIs & Webhooks → + Create key**; it is shown once. OAuth login does not
work here because the CLI callback targets `127.0.0.1:45817` on the VPS. After publishing,
upgrade the app in **Settings → Applications** (or enable auto-upgrade). No Docker
rebuild is needed for this step.

Check what is actually installed with:

```
docker exec twenty-db-1 psql -U postgres -d default \
  -tAc 'select name, version, "autoUpgrade", state from core.application order by name'
```
