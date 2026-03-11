#!/usr/bin/env bash
set -euo pipefail

# create-new-feature.sh — Create a new feature branch and spec directory
# Used by: /speckit.specify
#
# Usage: create-new-feature.sh [--json] [--number N] [--short-name "name"] "description"

JSON_OUTPUT=false
FEATURE_NUMBER=""
SHORT_NAME=""
DESCRIPTION=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json|-Json) JSON_OUTPUT=true; shift ;;
    --number|-Number) FEATURE_NUMBER="$2"; shift 2 ;;
    --short-name|-ShortName) SHORT_NAME="$2"; shift 2 ;;
    -*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) DESCRIPTION="$1"; shift ;;
  esac
done

if [[ -z "$DESCRIPTION" ]]; then
  echo "ERROR: No feature description provided" >&2
  exit 1
fi

if [[ -z "$SHORT_NAME" ]]; then
  echo "ERROR: --short-name is required" >&2
  exit 1
fi

if [[ -z "$FEATURE_NUMBER" ]]; then
  echo "ERROR: --number is required" >&2
  exit 1
fi

# Get repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: Not inside a git repository" >&2
  exit 1
}

BRANCH_NAME="${FEATURE_NUMBER}-${SHORT_NAME}"
FEATURE_DIR="${REPO_ROOT}/specs/${BRANCH_NAME}"
FEATURE_SPEC="${FEATURE_DIR}/spec.md"
TEMPLATE="${REPO_ROOT}/.specify/templates/spec-template.md"
TODAY="$(date +%Y-%m-%d)"

# Check branch doesn't already exist
if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}" 2>/dev/null; then
  echo "ERROR: Branch '${BRANCH_NAME}' already exists" >&2
  exit 1
fi

# Check spec dir doesn't already exist
if [[ -d "$FEATURE_DIR" ]]; then
  echo "ERROR: Feature directory '${FEATURE_DIR}' already exists" >&2
  exit 1
fi

# Create and checkout branch
git checkout -b "$BRANCH_NAME"

# Create feature directory structure
mkdir -p "${FEATURE_DIR}/checklists"
mkdir -p "${FEATURE_DIR}/contracts"

# Copy and fill template
if [[ -f "$TEMPLATE" ]]; then
  sed \
    -e "s|\[FEATURE NAME\]|${SHORT_NAME}|g" \
    -e "s|\[###-feature-name\]|${BRANCH_NAME}|g" \
    -e "s|\[DATE\]|${TODAY}|g" \
    -e "s|\\\$ARGUMENTS|${DESCRIPTION}|g" \
    "$TEMPLATE" > "$FEATURE_SPEC"
else
  # Minimal spec if template missing
  cat > "$FEATURE_SPEC" <<EOF
# Feature Specification: ${SHORT_NAME}

**Feature Branch**: \`${BRANCH_NAME}\`
**Created**: ${TODAY}
**Status**: Draft
**Input**: User description: "${DESCRIPTION}"
EOF
fi

if $JSON_OUTPUT; then
  cat <<EOF
{
  "BRANCH_NAME": "${BRANCH_NAME}",
  "FEATURE_DIR": "${FEATURE_DIR}",
  "FEATURE_SPEC": "${FEATURE_SPEC}"
}
EOF
else
  echo "Created feature branch: ${BRANCH_NAME}"
  echo "Feature directory: ${FEATURE_DIR}"
  echo "Spec file: ${FEATURE_SPEC}"
fi
