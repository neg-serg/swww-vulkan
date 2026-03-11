#!/usr/bin/env bash
set -euo pipefail

# check-prerequisites.sh — Validate current branch and extract feature metadata
# Used by: /speckit.clarify
#
# Usage: check-prerequisites.sh [--json] [--paths-only]

JSON_OUTPUT=false
PATHS_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json|-Json) JSON_OUTPUT=true; shift ;;
    --paths-only|-PathsOnly) PATHS_ONLY=true; shift ;;
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

# Extract feature number and name from branch (pattern: N-feature-name)
if [[ ! "$BRANCH" =~ ^([0-9]+)-(.+)$ ]]; then
  echo "ERROR: Branch '$BRANCH' does not match feature pattern [NUMBER]-[name]" >&2
  echo "Run /speckit.specify to create a feature branch first." >&2
  exit 1
fi

FEATURE_NUMBER="${BASH_REMATCH[1]}"
FEATURE_NAME="${BASH_REMATCH[2]}"
FEATURE_SLUG="${FEATURE_NUMBER}-${FEATURE_NAME}"

FEATURE_DIR="${REPO_ROOT}/specs/${FEATURE_SLUG}"
FEATURE_SPEC="${FEATURE_DIR}/spec.md"
IMPL_PLAN="${FEATURE_DIR}/plan.md"
TASKS="${FEATURE_DIR}/tasks.md"

# Validate spec exists
if [[ ! -f "$FEATURE_SPEC" ]]; then
  echo "ERROR: Feature spec not found at ${FEATURE_SPEC}" >&2
  echo "Run /speckit.specify to create the specification first." >&2
  exit 1
fi

if $JSON_OUTPUT; then
  if $PATHS_ONLY; then
    cat <<EOF
{
  "FEATURE_DIR": "${FEATURE_DIR}",
  "FEATURE_SPEC": "${FEATURE_SPEC}",
  "IMPL_PLAN": "${IMPL_PLAN}",
  "TASKS": "${TASKS}"
}
EOF
  else
    cat <<EOF
{
  "BRANCH": "${BRANCH}",
  "FEATURE_NUMBER": ${FEATURE_NUMBER},
  "FEATURE_NAME": "${FEATURE_NAME}",
  "FEATURE_SLUG": "${FEATURE_SLUG}",
  "FEATURE_DIR": "${FEATURE_DIR}",
  "FEATURE_SPEC": "${FEATURE_SPEC}",
  "IMPL_PLAN": "${IMPL_PLAN}",
  "TASKS": "${TASKS}",
  "SPEC_EXISTS": $([ -f "$FEATURE_SPEC" ] && echo true || echo false),
  "PLAN_EXISTS": $([ -f "$IMPL_PLAN" ] && echo true || echo false),
  "TASKS_EXISTS": $([ -f "$TASKS" ] && echo true || echo false)
}
EOF
  fi
else
  echo "Feature: ${FEATURE_SLUG}"
  echo "Spec:    ${FEATURE_SPEC} $([ -f "$FEATURE_SPEC" ] && echo '[exists]' || echo '[missing]')"
  echo "Plan:    ${IMPL_PLAN} $([ -f "$IMPL_PLAN" ] && echo '[exists]' || echo '[missing]')"
  echo "Tasks:   ${TASKS} $([ -f "$TASKS" ] && echo '[exists]' || echo '[missing]')"
fi
