#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-up}"
SERVICE="${2:-api}"

case "$CMD" in
  up|rebuild)
    docker compose up -d --build "$SERVICE"
    ;;
  down)
    docker compose stop "$SERVICE"
    ;;
  logs)
    docker compose logs -f "$SERVICE"
    ;;
  ps)
    docker compose ps
    ;;
  health)
    curl -fsS http://localhost:3000/health || exit 1
    ;;
  *)
    echo "Usage: $0 {up|down|logs|rebuild|ps|health} [api|api-dev]" >&2
    exit 2
    ;;
esac

