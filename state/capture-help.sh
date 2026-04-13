#!/usr/bin/env bash
# Capture CLI --help output for a product and all its subcommands.
# Usage: capture-help.sh <cli> <outdir>
set -uo pipefail
CLI="${1:?cli required}"
OUT="${2:?outdir required}"
mkdir -p "$OUT"
rm -f "$OUT"/*.txt 2>/dev/null || true

# Capture top-level
"$CLI" --help > "$OUT/_root.txt" 2>&1 || true

# Extract command names (words starting in column 2-4 of "Commands:" or "COMMANDS:" section)
# We use a generic approach: parse help output for indented command patterns
extract_commands() {
  local helpfile="$1"
  # Match lines like "  command   description" or "  command, alias   description"
  # Only after a "Commands:" or similar header
  awk '
    BEGIN { in_cmds=0 }
    /^(Commands|COMMANDS|Subcommands|SUBCOMMANDS|Available [Cc]ommands):?/ { in_cmds=1; next }
    /^[A-Za-z]/ && in_cmds && !/^(Options|OPTIONS|Flags|FLAGS|Examples|EXAMPLES|Global)/ { next }
    /^(Options|OPTIONS|Flags|FLAGS|Examples|EXAMPLES|Global [Oo]ptions)/ { in_cmds=0 }
    in_cmds && /^[[:space:]]+[a-z][a-z0-9_-]*/ {
      # first token on the line
      sub(/^[[:space:]]+/, "", $0)
      name = $1
      # strip trailing comma if alias list like "ls, list"
      gsub(/,.*/, "", name)
      if (name !~ /^-/ && length(name) > 0) print name
    }
  ' "$helpfile" | sort -u
}

# Level 1: top-level commands
CMDS=$(extract_commands "$OUT/_root.txt")
echo "Level 1 commands: $(echo "$CMDS" | wc -l)" >&2
for cmd in $CMDS; do
  [ -z "$cmd" ] && continue
  safe=$(echo "$cmd" | tr '/' '_')
  "$CLI" "$cmd" --help > "$OUT/${safe}.txt" 2>&1 || true

  # Level 2: subcommands
  SUBS=$(extract_commands "$OUT/${safe}.txt")
  for sub in $SUBS; do
    [ -z "$sub" ] && continue
    subsafe=$(echo "$sub" | tr '/' '_')
    "$CLI" "$cmd" "$sub" --help > "$OUT/${safe}-${subsafe}.txt" 2>&1 || true
  done
done

echo "Captured $(ls "$OUT"/*.txt 2>/dev/null | wc -l) help files to $OUT" >&2
