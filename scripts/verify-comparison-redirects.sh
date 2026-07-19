#!/usr/bin/env bash
#
# Verify legacy parameterized comparison redirects against a running
# deployment (Cloudflare preview, production, or local `wrangler pages dev`).
#
# Usage:
#   scripts/verify-comparison-redirects.sh https://<preview>.pages.dev
#   scripts/verify-comparison-redirects.sh https://tirereference.com
#   scripts/verify-comparison-redirects.sh http://127.0.0.1:8793
#
# Manual spot checks (equivalent curl commands):
#   curl -I  "$BASE/calculators/tire-comparison-calculator/?current=215/55R17&new=205/55R16"
#     → expect: HTTP 301, Location: $BASE/compare/205-55-r16-vs-215-55-r17/
#   curl -IL "$BASE/calculators/tire-comparison-calculator/?current=215/55R17&new=205/55R16"
#     → expect: exactly one 301 followed by one 200 (301 → 200).
set -u

BASE="${1:?Usage: $0 <base-url> (e.g. https://preview.pages.dev)}"
BASE="${BASE%/}"
FAILURES=0

# check <path> <expected-status> <expected-location-path-or-empty>
check() {
  local path="$1" expected_status="$2" expected_location="$3"
  local result status location
  result=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE$path") || {
    echo "FAIL  $path — curl request failed"
    FAILURES=$((FAILURES + 1))
    return
  }
  status="${result%% *}"
  location="${result#* }"

  if [[ "$status" != "$expected_status" ]]; then
    echo "FAIL  $path — expected status $expected_status, got $status"
    FAILURES=$((FAILURES + 1))
    return
  fi
  if [[ -n "$expected_location" && "$location" != "$BASE$expected_location" ]]; then
    echo "FAIL  $path — expected Location $BASE$expected_location, got ${location:-<none>}"
    FAILURES=$((FAILURES + 1))
    return
  fi
  echo "PASS  $path → $status ${expected_location:+$expected_location}"
}

# check_chain <path> <expected-redirect-count> <expected-final-path>
check_chain() {
  local path="$1" expected_hops="$2" expected_final="$3"
  local result hops final_status final_url
  result=$(curl -sL -o /dev/null -w '%{num_redirects} %{http_code} %{url_effective}' "$BASE$path") || {
    echo "FAIL  chain $path — curl request failed"
    FAILURES=$((FAILURES + 1))
    return
  }
  read -r hops final_status final_url <<<"$result"

  if [[ "$hops" != "$expected_hops" || "$final_status" != "200" || "$final_url" != "$BASE$expected_final" ]]; then
    echo "FAIL  chain $path — got $hops redirect(s) → $final_status $final_url (expected $expected_hops → 200 $BASE$expected_final)"
    FAILURES=$((FAILURES + 1))
    return
  fi
  echo "PASS  chain $path → $hops redirect(s) → 200 $expected_final"
}

CALC="/calculators/tire-comparison-calculator/"
CANONICAL="/compare/205-55-r16-vs-215-55-r17/"

echo "Verifying comparison redirects on $BASE"
echo

# 1. Valid legacy params: direct single 301 to the final canonical pair order.
check "${CALC}?current=215/55R17&new=205/55R16" 301 "$CANONICAL"
check "${CALC}?current=205/55R16&new=215/55R17" 301 "$CANONICAL"

# 2. Encoded slashes, lowercase r, and trimmable whitespace.
check "${CALC}?current=215%2F55R17&new=205%2F55R16" 301 "$CANONICAL"
check "${CALC}?current=215/55r17&new=205/55r16" 301 "$CANONICAL"
check "${CALC}?current=%20215/55R17%20&new=%20205/55R16%20" 301 "$CANONICAL"

# 3. Invalid / same-size / partial params: calculator, never a default comparison.
check "${CALC}?current=banana&new=205/55R16" 301 "$CALC"
check "${CALC}?current=205/55R16&new=205/55R16" 301 "$CALC"
check "${CALC}?current=205/55R16" 301 "${CALC}?from=205%2F55R16"

# 4. Plain calculator stays a 200 page.
check "$CALC" 200 ""

# 5. Reversed clean URL consolidates; canonical clean URL serves directly.
check "/compare/215-55-r17-vs-205-55-r16/" 301 "$CANONICAL"
check "$CANONICAL" 200 ""

# 6. Full chains: exactly one redirect, ending on the canonical 200 page.
check_chain "${CALC}?current=215/55R17&new=205/55R16" 1 "$CANONICAL"
check_chain "/compare/215-55-r17-vs-205-55-r16/" 1 "$CANONICAL"

echo
if [[ "$FAILURES" -gt 0 ]]; then
  echo "Result: FAIL — $FAILURES check(s) failed."
  exit 1
fi
echo "Result: PASS — all comparison redirect checks passed."
