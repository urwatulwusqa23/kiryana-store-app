#!/bin/sh
# Render and other PaaS set PORT; Kestrel must listen on that port, not a fixed 8080.
set -e
PORT="${PORT:-8080}"
export ASPNETCORE_URLS="http://+:${PORT}"
# Reduce glibc memory arenas on small free workers (less fragmentation / OOM edge cases)
export MALLOC_ARENA_MAX="${MALLOC_ARENA_MAX:-2}"
# Workstation GC is often more predictable than server GC in low-memory (512MB) web dynos
export COMPlus_gcServer=0
exec dotnet /app/KiryanaStore.API.dll
