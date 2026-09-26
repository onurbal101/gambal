#!/usr/bin/env bash
set -eu

readonly app_root=/home/deploy/services/apps/gambal
readonly release_root="$app_root/releases"
readonly request="${SSH_ORIGINAL_COMMAND:-}"

deny() {
  printf '%s\n' 'Gambal deploy key: command denied' >&2
  exit 1
}

if [[ "$request" == 'rsync --server '* ]]; then
  exec /usr/bin/rrsync -wo "$release_root"
fi

if [[ "$request" =~ ^prepare[[:space:]]([[:xdigit:]]{40})[[:space:]]([0-9]+)$ ]]; then
  commit_sha="${BASH_REMATCH[1]}"
  run_id="${BASH_REMATCH[2]}"
  release_name="$commit_sha-$run_id"
  release_path="$release_root/$release_name"
  [[ ! -L "$release_path" ]] || deny
  mkdir -p -- "$release_path"
  chmod 755 -- "$release_path"
  exit 0
fi

if [[ "$request" =~ ^activate[[:space:]]([[:xdigit:]]{40})[[:space:]]([0-9]+)$ ]]; then
  commit_sha="${BASH_REMATCH[1]}"
  run_id="${BASH_REMATCH[2]}"
  release_name="$commit_sha-$run_id"
  release_path="$release_root/$release_name"
  [[ -d "$release_path" && ! -L "$release_path" ]] || deny
  [[ -s "$release_path/index.html" ]] || deny

  link_path="$app_root/.current-$run_id-$$"
  ln -s -- "releases/$release_name" "$link_path"
  mv -Tf -- "$link_path" "$app_root/current"
  exit 0
fi

deny
