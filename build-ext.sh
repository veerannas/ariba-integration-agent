#!/bin/bash
# build-ext.sh — Build, version, and deploy Ariba Integration Agent Chrome Extension.
# Version lives only in manifest.json — no other file carries it.
#
# Usage:
#   ./build-ext.sh               — build + patch bump
#   ./build-ext.sh --patch       — force patch bump
#   ./build-ext.sh --minor       — force minor bump
#   ./build-ext.sh --major       — force major bump
#   ./build-ext.sh --no-bump     — skip bump (blocked if source changed)
#   ./build-ext.sh --force-stale — allow --no-bump even if source changed
#   ./build-ext.sh -m "msg"      — attach note to CHANGELOG entry
#
# Env:
#   ARIBA_CDP_PORT=9230   Chrome remote-debug port (default 9230)

set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

CDP_PORT="${ARIBA_CDP_PORT:-9230}"
EXT_NAME="Ariba Integration Agent"   # matched against chrome.runtime.getManifest().name

# ── Version brain ─────────────────────────────────────────────────────────────

VV_SRC_GLOBS=(
  "sidepanel.js" "sidepanel.html" "background.js" "content.js"
  "atlas-updater.js" "manifest.json"
)

_vv_md5() { md5 -q "$1" 2>/dev/null || md5sum "$1" 2>/dev/null | awk '{print $1}'; }

vv_current_version() {
  python3 -c "import json;print(json.load(open('$1'))['version'])" 2>/dev/null || echo "1.0.0"
}

vv_source_hash() {
  local dir="$1" acc="" f
  for f in "${VV_SRC_GLOBS[@]}"; do
    [ -f "$dir/$f" ] || continue
    if [ "$f" = "manifest.json" ]; then
      acc+=$(python3 -c "import json;d=json.load(open('$dir/$f'));d.pop('version',None);print(json.dumps(d,sort_keys=True))" 2>/dev/null)
    else
      acc+=$(_vv_md5 "$dir/$f")
    fi
  done
  printf '%s' "$acc" | _vv_md5 /dev/stdin 2>/dev/null || printf '%s' "$acc" | (md5 2>/dev/null || md5sum | awk '{print $1}')
}

vv_source_changed() {
  local last cur
  last=$(cat "$DIR/.last-build-hash" 2>/dev/null || echo "")
  cur=$(vv_source_hash "$DIR")
  [ "$cur" != "$last" ]
}

vv_mark_built() {
  vv_source_hash "$DIR" > "$DIR/.last-build-hash"
}

# Bump manifest.json with cap-at-9 rollover. Echoes new version.
vv_apply_bump() {
  local level="$1"
  local cur; cur=$(vv_current_version "$DIR/manifest.json")
  local MAJOR MINOR PATCH
  IFS='.' read -r MAJOR MINOR PATCH <<< "$cur"
  MAJOR=${MAJOR:-1}; MINOR=${MINOR:-0}; PATCH=${PATCH:-0}
  case "$level" in
    major) MAJOR=$((MAJOR+1)); MINOR=0; PATCH=0 ;;
    minor) MINOR=$((MINOR+1)); PATCH=0
           [ "$MINOR" -gt 9 ] && { MAJOR=$((MAJOR+1)); MINOR=0; } ;;
    *)     PATCH=$((PATCH+1))
           if [ "$PATCH" -gt 9 ]; then MINOR=$((MINOR+1)); PATCH=0
             [ "$MINOR" -gt 9 ] && { MAJOR=$((MAJOR+1)); MINOR=0; }
           fi ;;
  esac
  local new_ver="${MAJOR}.${MINOR}.${PATCH}"
  python3 -c "
import json
d=json.load(open('$DIR/manifest.json'))
d['version']='$new_ver'
open('$DIR/manifest.json','w').write(json.dumps(d,indent=2)+'\n')
"
  echo "$new_ver"
}

# ── Arg parsing ───────────────────────────────────────────────────────────────

FORCED=""; NO_BUMP=0; FORCE_STALE=0; MSG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --bump|--patch) FORCED="patch" ;;
    --minor)        FORCED="minor" ;;
    --major)        FORCED="major" ;;
    --no-bump)      NO_BUMP=1 ;;
    --force-stale)  FORCE_STALE=1 ;;
    -m)             shift; MSG="$1" ;;
  esac
  shift
done

TS=$(date +%Y%m%d-%H%M%S)
echo "🔨 Building Ariba Integration Agent..."

# ── 1. Validate JS syntax ─────────────────────────────────────────────────────
echo "  🔍 Validating..."
node -c "$DIR/sidepanel.js"      || { echo "❌ sidepanel.js syntax error"; exit 1; }
node -c "$DIR/background.js"     || { echo "❌ background.js syntax error"; exit 1; }
node -c "$DIR/content.js"        || { echo "❌ content.js syntax error"; exit 1; }
node -c "$DIR/atlas-updater.js"  || { echo "❌ atlas-updater.js syntax error"; exit 1; }

python3 -c "
import re, sys
src = open('$DIR/background.js').read()
decls = {m.group(1): m.start() for m in re.finditer(r'^(?:const|let)\s+(\w+)', src, re.MULTILINE)}
errors = []
for name, pos in decls.items():
    first = re.search(r'\b' + re.escape(name) + r'\b', src)
    if first and first.start() < pos:
        line = src[:first.start()].count('\n') + 1
        errors.append(f'  TDZ: {name} used at line {line}, declared at {src[:pos].count(chr(10))+1}')
if errors:
    print('❌ TDZ violations in background.js:')
    for e in errors: print(e)
    sys.exit(1)
else:
    print('  ✅ No TDZ violations')
"
echo "  ✅ Syntax OK"

# ── 2. Version bump ───────────────────────────────────────────────────────────
CURRENT=$(vv_current_version "$DIR/manifest.json")

if [ "$NO_BUMP" -eq 1 ]; then
  if vv_source_changed && [ "$FORCE_STALE" -eq 0 ]; then
    echo "❌ --no-bump blocked: source changed. Add --force-stale to override."; exit 1
  fi
  echo "  ℹ️  Version: $CURRENT (bump skipped)"
  NEW_VER="$CURRENT"
else
  LEVEL="${FORCED:-patch}"
  NEW_VER=$(vv_apply_bump "$LEVEL")
  echo "  🔖 Version: $CURRENT → $NEW_VER  [$LEVEL]"
fi

vv_mark_built

# ── 3. CHANGELOG ─────────────────────────────────────────────────────────────
CHANGELOG="$DIR/CHANGELOG.md"
NOTE="${MSG:+ — $MSG}"
ENTRY="## $NEW_VER — $(date '+%Y-%m-%d %H:%M')$NOTE"
if [ -f "$CHANGELOG" ]; then
  TMP=$(mktemp)
  { echo "$ENTRY"; echo ""; cat "$CHANGELOG"; } > "$TMP" && mv "$TMP" "$CHANGELOG"
else
  printf '%s\n\n' "$ENTRY" > "$CHANGELOG"
fi
echo "  📝 CHANGELOG updated"

# ── 4. Reload + verify in Chrome via CDP ─────────────────────────────────────
echo ""
if curl -sf "http://127.0.0.1:${CDP_PORT}/json/version" >/dev/null 2>&1; then
  echo "🔄 Reloading extension via CDP (:$CDP_PORT)..."
  RESULT=$(CDP_PORT="$CDP_PORT" EXT_NAME="$EXT_NAME" WANT_VER="$NEW_VER" python3 - << 'PY'
import json, os, time, urllib.request
try:
    from websocket import create_connection
except Exception:
    print("SKIP: websocket-client not installed"); raise SystemExit

PORT     = os.environ["CDP_PORT"]
EXT_NAME = os.environ["EXT_NAME"]
WANT     = os.environ["WANT_VER"]

def list_pages():
    try:
        return json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list', timeout=4))
    except Exception:
        return []

def find_sw():
    for p in list_pages():
        if p.get('type') != 'service_worker':
            continue
        try:
            ws = create_connection(p['webSocketDebuggerUrl'], suppress_origin=True, timeout=3)
            ws.send(json.dumps({"id":1,"method":"Runtime.evaluate","params":{"expression":"chrome.runtime.getManifest().name","returnByValue":True}}))
            r = json.loads(ws.recv())
            name = r.get('result',{}).get('result',{}).get('value','')
            ws.close()
            if EXT_NAME.lower() in name.lower():
                return p
        except Exception:
            pass
    return None

sw = find_sw()
if not sw:
    print("NOT FOUND — load the extension in chrome://extensions first"); raise SystemExit

# Reload the service worker
try:
    ws = create_connection(sw['webSocketDebuggerUrl'], suppress_origin=True, timeout=5)
    ws.send(json.dumps({"id":1,"method":"Runtime.evaluate","params":{"expression":"chrome.runtime.reload()"}}))
    ws.close()
except Exception:
    pass

# Wait and verify version
for _ in range(8):
    time.sleep(2)
    sw = find_sw()
    if not sw:
        continue
    try:
        ws = create_connection(sw['webSocketDebuggerUrl'], suppress_origin=True, timeout=5)
        ws.send(json.dumps({"id":2,"method":"Runtime.evaluate","params":{"expression":"chrome.runtime.getManifest().version","returnByValue":True}}))
        v = json.loads(ws.recv()).get('result',{}).get('result',{}).get('value')
        ws.close()
        if v:
            print(("OK: loaded " + v) if v == WANT else f"MISMATCH: loaded {v}, expected {WANT}")
            raise SystemExit
    except Exception:
        continue
print("SW idle — reopen sidepanel to verify")
PY
)
  echo "  $RESULT"
  [[ "$RESULT" == MISMATCH* ]] && echo "  ⚠️  Stale — reopen sidepanel / hard-reload."

  # Force-reload any open sidepanel pages
  CDP_PORT="$CDP_PORT" EXT_NAME="$EXT_NAME" python3 - << 'PY2' 2>/dev/null
import json, os, urllib.request
try:
    from websocket import create_connection
except Exception:
    raise SystemExit
PORT = os.environ.get("CDP_PORT", "9230")
EXT_NAME = os.environ.get("EXT_NAME", "")
try:
    pages = json.load(urllib.request.urlopen(f'http://127.0.0.1:{PORT}/json/list', timeout=4))
except Exception:
    raise SystemExit
sp = [p for p in pages if 'sidepanel.html' in p.get('url','') and p.get('type') == 'page']
for p in sp:
    try:
        ws = create_connection(p['webSocketDebuggerUrl'], suppress_origin=True, timeout=5)
        ws.send(json.dumps({"id":1,"method":"Page.reload","params":{"ignoreCache":True}}))
        ws.close()
        print(f"  ↺  Reloaded sidepanel ({p['id'][:8]}...)")
    except Exception:
        pass
PY2
else
  echo "✅ Build complete (Chrome not reachable — reload manually):"
  echo "    chrome://extensions → Ariba Integration Agent → ↺"
fi

echo ""
echo "━━━ Build complete [$NEW_VER] [$TS] ━━━"
