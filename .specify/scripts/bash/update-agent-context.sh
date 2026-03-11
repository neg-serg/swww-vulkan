#!/usr/bin/env bash
set -euo pipefail

# update-agent-context.sh — Update agent-specific context file with feature info
# Used by: /speckit.plan Phase 1
#
# Usage: update-agent-context.sh <agent-name>
#   agent-name: "claude" | "cursor" | "copilot"

AGENT_NAME="${1:-}"

if [[ -z "$AGENT_NAME" ]]; then
  echo "ERROR: Agent name required (claude, cursor, copilot)" >&2
  exit 1
fi

# Get repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: Not inside a git repository" >&2
  exit 1
}

# Get current branch
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)" || {
  echo "ERROR: Cannot determine current branch" >&2
  exit 1
}

# Extract feature slug from branch
if [[ ! "$BRANCH" =~ ^([0-9]+)-(.+)$ ]]; then
  echo "ERROR: Branch '$BRANCH' does not match feature pattern [NUMBER]-[name]" >&2
  exit 1
fi

FEATURE_SLUG="${BASH_REMATCH[1]}-${BASH_REMATCH[2]}"
SPECS_DIR="${REPO_ROOT}/specs/${FEATURE_SLUG}"

# Determine context file based on agent
case "$AGENT_NAME" in
  claude)
    CONTEXT_DIR="${REPO_ROOT}/.claude"
    CONTEXT_FILE="${CONTEXT_DIR}/CLAUDE.md"
    ;;
  cursor)
    CONTEXT_DIR="${REPO_ROOT}"
    CONTEXT_FILE="${CONTEXT_DIR}/.cursorrules"
    ;;
  copilot)
    CONTEXT_DIR="${REPO_ROOT}/.github"
    CONTEXT_FILE="${CONTEXT_DIR}/copilot-instructions.md"
    ;;
  *)
    echo "ERROR: Unknown agent '${AGENT_NAME}'. Supported: claude, cursor, copilot" >&2
    exit 1
    ;;
esac

mkdir -p "$CONTEXT_DIR"

# Markers for managed section
BEGIN_MARKER="<!-- BEGIN SPECKIT CONTEXT -->"
END_MARKER="<!-- END SPECKIT CONTEXT -->"

# Build the context block
CONTEXT_BLOCK="${BEGIN_MARKER}
## Current Feature: ${FEATURE_SLUG}

**Branch**: \`${BRANCH}\`
**Spec**: \`specs/${FEATURE_SLUG}/spec.md\`
**Plan**: \`specs/${FEATURE_SLUG}/plan.md\`

### Key Documents
- Constitution: \`.specify/memory/constitution.md\`
- Feature Spec: \`specs/${FEATURE_SLUG}/spec.md\`
- Implementation Plan: \`specs/${FEATURE_SLUG}/plan.md\`
$([ -f "${SPECS_DIR}/research.md" ] && echo "- Research: \`specs/${FEATURE_SLUG}/research.md\`" || true)
$([ -f "${SPECS_DIR}/data-model.md" ] && echo "- Data Model: \`specs/${FEATURE_SLUG}/data-model.md\`" || true)
$([ -d "${SPECS_DIR}/contracts" ] && [ "$(ls -A "${SPECS_DIR}/contracts" 2>/dev/null)" ] && echo "- Contracts: \`specs/${FEATURE_SLUG}/contracts/\`" || true)
$([ -f "${SPECS_DIR}/tasks.md" ] && echo "- Tasks: \`specs/${FEATURE_SLUG}/tasks.md\`" || true)
${END_MARKER}"

if [[ -f "$CONTEXT_FILE" ]]; then
  # Check if managed section exists
  if grep -qF "$BEGIN_MARKER" "$CONTEXT_FILE"; then
    # Replace existing managed section
    # Use awk to replace between markers
    awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" -v block="$CONTEXT_BLOCK" '
      $0 == begin { print block; skip=1; next }
      $0 == end { skip=0; next }
      !skip { print }
    ' "$CONTEXT_FILE" > "${CONTEXT_FILE}.tmp"
    mv "${CONTEXT_FILE}.tmp" "$CONTEXT_FILE"
  else
    # Append managed section
    printf '\n%s\n' "$CONTEXT_BLOCK" >> "$CONTEXT_FILE"
  fi
else
  # Create new context file
  echo "$CONTEXT_BLOCK" > "$CONTEXT_FILE"
fi

echo "Updated ${CONTEXT_FILE} for feature ${FEATURE_SLUG}"
