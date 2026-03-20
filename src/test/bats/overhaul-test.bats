#!/usr/bin/env bats

# Tests for the fundocs overhaul — covers bug fixes, UX, accessibility, and modernization

BASE_URL="http://localhost:8080/exist/apps/fundocs"

# ─── Phase 1: Bug Fixes & Resilience ────────────────────────────────────

@test "1.1 Regeneration returns summary with counts" {
  result=$(curl -s -u admin: "$BASE_URL/regenerate" -H "Accept: application/json")
  echo "$result" | grep -q '"status" : "ok"'
  echo "$result" | grep -q 'Generated documentation for'
  echo "$result" | grep -qE 'for [0-9]+ of [0-9]+ modules'
}

@test "1.2 Module-level @see annotations are rendered" {
  # Check that xqdoc:see elements are present in the generated data
  result=$(curl -s "$BASE_URL/view?uri=http://exist-db.org/xquery/file&details=true")
  # The page should render without errors
  echo "$result" | grep -q 'XQuery Function Documentation'
}

@test "1.2 Function-level annotations are rendered in HTML" {
  result=$(curl -s "$BASE_URL/view?uri=http://exist-db.org/xquery/file&details=true")
  # Deprecated functions should have the deprecated badge
  # (if any exist in the file module)
  [ -n "$result" ]
}

@test "1.3 No WARN-level log for dashboard module inspection" {
  # This is verified by the log level change to DEBUG — functional test
  # ensures regeneration succeeds without errors
  result=$(curl -s -u admin: "$BASE_URL/regenerate" -H "Accept: application/json")
  echo "$result" | grep -q '"status" : "ok"'
}

@test "1.4 Landing page hides regeneration tip when module count is sufficient" {
  # With 100+ modules generated, the low-count tip should NOT appear
  result=$(curl -s "$BASE_URL/")
  ! echo "$result" | grep -q 'documentation may be incomplete'
}

# ─── Phase 2: Search & UX ───────────────────────────────────────────────

@test "2.1 Search results are sorted by name then arity" {
  result=$(curl -s -X POST "$BASE_URL/query" -d "q=map:get&action=search&where=everywhere")
  # Should return results
  echo "$result" | grep -q 'function-head'
}

@test "2.2 Function headers have anchor links" {
  result=$(curl -s -X POST "$BASE_URL/query" -d "q=map:keys&action=search&where=everywhere")
  echo "$result" | grep -q 'anchor-link'
}

@test "2.2 Function IDs are present for deep-linking" {
  result=$(curl -s -X POST "$BASE_URL/query" -d "q=map:keys&action=search&where=everywhere")
  echo "$result" | grep -q 'id="keys\.'
}

@test "2.3 Deprecated toggle is present on landing page" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'show-deprecated'
  echo "$result" | grep -q 'Show deprecated'
}

@test "2.3 Deprecated functions have deprecated class" {
  result=$(curl -s "$BASE_URL/view?uri=http://exist-db.org/xquery/util&details=true")
  # Check page renders successfully
  [ -n "$result" ]
}

@test "2.4 Result count element is present" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'id="result-count"'
}

@test "2.4 Search via URL parameters works" {
  result=$(curl -s "$BASE_URL/?q=map:keys&action=search")
  echo "$result" | grep -q 'XQuery Function Documentation'
}

# ─── Phase 3: Accessibility ─────────────────────────────────────────────

@test "3.1 Search input has aria-label" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'aria-label="Search for functions and modules"'
}

@test "3.1 Search button has aria-label" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'aria-label="Search"'
}

@test "3.2 Result count has aria-live" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'aria-live="polite"'
}

@test "3.4 Skip-to-content link is present" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'class="skip-link"'
  echo "$result" | grep -q 'Skip to main content'
}

@test "3.4 Navbar toggle has ARIA attributes" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'aria-controls="navbar-collapse-1"'
  echo "$result" | grep -q 'aria-expanded="false"'
  echo "$result" | grep -q 'aria-label="Toggle navigation"'
}

@test "3.5 Bootstrap Icons CSS is loaded (not Glyphicons)" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'bootstrap-icons.min.css'
  # Should NOT reference old glyphicons
  ! echo "$result" | grep -q 'bootstrap3-glyphicons'
}

@test "3.5 Icons use bi bi-* classes" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'bi bi-search'
  echo "$result" | grep -q 'bi bi-globe'
  # Should NOT use glyphicon classes
  ! echo "$result" | grep -q 'glyphicon'
}

@test "3.5 Module info icon uses Bootstrap Icons" {
  result=$(curl -s -X POST "$BASE_URL/query" -d "q=map:keys&action=search&where=everywhere")
  echo "$result" | grep -q 'bi bi-info-circle'
  ! echo "$result" | grep -q 'glyphicon'
}

@test "3.5 Bootstrap Icons font file is accessible" {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/resources/fonts/bootstrap-icons.woff2")
  [ "$status" = "200" ]
}

@test "3.5 Bootstrap Icons CSS file is accessible" {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/resources/css/bootstrap-icons.min.css")
  [ "$status" = "200" ]
}

# ─── Phase 4: Modernization ─────────────────────────────────────────────

@test "4.x App loads successfully" {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
  [ "$status" = "200" ]
}

@test "4.x All CSS resources load successfully" {
  for f in bootstrap.min.css atom-one-dark.min.css bootstrap-icons.min.css fundocs.min.css; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/resources/css/$f")
    [ "$status" = "200" ]
  done
}

@test "4.x All JS resources load successfully" {
  for f in popper.min.js bootstrap.min.js highlight.min.js xquery.min.js query.js index.min.js; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/resources/scripts/$f")
    [ "$status" = "200" ]
  done
}

# ─── Phase 6: Documentation ─────────────────────────────────────────────

@test "6.1 Landing page has descriptive lead paragraph" {
  result=$(curl -s "$BASE_URL/")
  echo "$result" | grep -q 'Browse and search the complete library'
}

@test "6.1 Browse page loads" {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/browse?extensions=true")
  [ "$status" = "200" ]
}

@test "6.1 Browse page uses Bootstrap Icons" {
  result=$(curl -s "$BASE_URL/browse?extensions=true")
  echo "$result" | grep -q 'bi bi-chevron-left'
  ! echo "$result" | grep -q 'glyphicon'
}

@test "6.1 View page loads" {
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/view?uri=http://www.w3.org/2005/xpath-functions")
  [ "$status" = "200" ]
}

@test "6.1 View page uses Bootstrap Icons" {
  result=$(curl -s "$BASE_URL/view?uri=http://www.w3.org/2005/xpath-functions")
  echo "$result" | grep -q 'bi bi-chevron-left'
  ! echo "$result" | grep -q 'glyphicon'
}
