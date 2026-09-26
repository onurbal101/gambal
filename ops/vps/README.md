# VPS deployment

The `main` branch deploys the Vite build to `/home/deploy/services/apps/gambal`
on the VPS. GitHub Actions uploads each build to a versioned release directory
and switches the `current` symlink only after the upload succeeds.

The VPS has Caddy serve `current` at `https://gambal.onurbal.com`. The deploy
SSH key is restricted to the `deploy-gateway.sh` command. It can upload files
inside the Gambal releases directory and activate a release. It cannot open a
shell or change the Caddy configuration.

Repository Actions settings:

- Variables: `GAMBAL_VPS_HOST`, `GAMBAL_VPS_PORT`, `GAMBAL_VPS_USER`
- Secrets: `GAMBAL_VPS_SSH_KEY`, `GAMBAL_VPS_KNOWN_HOSTS`

The deploy key's authorized key entry must force `/home/deploy/services/apps/gambal/deploy-gateway`
and set the `restrict` option. Keep the VPS host key pinned in
`GAMBAL_VPS_KNOWN_HOSTS`.
