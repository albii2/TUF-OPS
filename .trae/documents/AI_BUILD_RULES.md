AI_BUILD_RULES.md

# TUF OPS — AI BUILD RULES (LOCKED)

## Core Rules

1. Data Contract Rule
- Return: object OR array OR null OR throw
- NEVER return undefined

2. Change Discipline
- Small, isolated changes only
- One logical change at a time
- No multi-file uncontrolled edits

3. File Structure
- Imports at top only
- No mid-file injection
- Keep files syntactically valid

4. No Feature Drift
- Only build what is specified
- Do not introduce new features
- Do not refactor unrelated code

5. Proof-First Execution
Before completing:
- show files touched
- summarize changes
- list regressions (if any)

6. No Blind Commits
- NEVER use `git add .`
- Add files explicitly

7. Controlled Execution
- Do NOT modify unrelated files
- Do NOT guess requirements
- Ask if unclear

8. Follow Build Spec Exactly
- Read full spec before coding
- Do not skip steps
- Do not improvise
