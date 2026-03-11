#!/usr/bin/env bash
set -euo pipefail

# setup-plan.sh — Prepare implementation plan phase
# Used by: /speckit.plan
#
# Usage: setup-plan.sh [--json]

JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json|-Json) JSON_OUTPUT=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

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

# Extract feature number and name from branch
if [[ ! "$BRANCH" =~ ^([0-9]+)-(.+)$ ]]; then
  echo "ERROR: Branch '$BRANCH' does not match feature pattern [NUMBER]-[name]" >&2
  echo "Run /speckit.specify to create a feature branch first." >&2
  exit 1
fi

FEATURE_NUMBER="${BASH_REMATCH[1]}"
FEATURE_NAME="${BASH_REMATCH[2]}"
FEATURE_SLUG="${FEATURE_NUMBER}-${FEATURE_NAME}"

SPECS_DIR="${REPO_ROOT}/specs/${FEATURE_SLUG}"
FEATURE_SPEC="${SPECS_DIR}/spec.md"
IMPL_PLAN="${SPECS_DIR}/plan.md"
TEMPLATE="${REPO_ROOT}/.specify/templates/plan-template.md"
TODAY="$(date +%Y-%m-%d)"

# Validate spec exists
if [[ ! -f "$FEATURE_SPEC" ]]; then
  echo "ERROR: Feature spec not found at ${FEATURE_SPEC}" >&2
  echo "Run /speckit.specify to create the specification first." >&2
  exit 1
fi

# Copy plan template if plan doesn't exist yet
if [[ ! -f "$IMPL_PLAN" ]]; then
  if [[ -f "$TEMPLATE" ]]; then
    sed \
      -e "s|\[FEATURE\]|${FEATURE_NAME}|g" \
      -e "s|\[###-feature-name\]|${FEATURE_SLUG}|g" \
      -e "s|\[DATE\]|${TODAY}|g" \
      -e "s|\[link\]|spec.md|g" \
      "$TEMPLATE" > "$IMPL_PLAN"
  else
    echo "ERROR: Plan template not found at ${TEMPLATE}" >&2
    exit 1
  fi
fi

# Ensure subdirectories exist
mkdir -p "${SPECS_DIR}/contracts"

if $JSON_OUTPUT; then
  cat <<EOF
{
  "FEATURE_SPEC": "${FEATURE_SPEC}",
  "IMPL_PLAN": "${IMPL_PLAN}",
  "SPECS_DIR": "${SPECS_DIR}",
  "BRANCH": "${BRANCH}"
}
EOF
else
  echo "Branch:  ${BRANCH}"
  echo "Spec:    ${FEATURE_SPEC}"
  echo "Plan:    ${IMPL_PLAN}"
  echo "Dir:     ${SPECS_DIR}"
fi
