#!/bin/zsh

cd "/Users/zanzajc/Documents/Codex/2026-05-11/ustvari-interno-spletno-aplikacijo-za-moj" || exit 1

echo "Starting FotoFlow Manager..."
echo "Open: http://localhost:3000/dashboard"
echo ""

npm run dev -- --hostname 127.0.0.1 --port 3000
