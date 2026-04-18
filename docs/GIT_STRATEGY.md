# Git Strategy

This document outlines the Git branching model, commit message conventions, and pull request process for the TUF Ops project.

## Branching Model

We will use a simplified GitFlow model. The main branches are:

- **`main`**: This branch represents the production-ready code. No direct commits are allowed to `main`. All changes must come from `release` branches.
- **`develop`**: This is the main development branch. All feature branches are created from `develop` and merged back into `develop`.
- **`feature/<feature-name>`**: Each new feature is developed in its own branch. These branches are created from `develop` and merged back into `develop` via a pull request.
- **`release/vX.X.X`**: When `develop` is ready for a release, a `release` branch is created. This branch is used for final testing and bug fixes before merging into `main`.
- **`hotfix/<hotfix-name>`**: Hotfixes are created from `main` and merged back into both `main` and `develop`.

## Commit Message Conventions

We will use the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This provides a standardized format for commit messages, which allows for automated changelog generation and better readability.

The format is:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

- **`type`**: Must be one of `feat`, `fix`, `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`.
- **`scope`**: (Optional) The package or module affected by the change (e.g., `auth`, `database`).
- **`description`**: A short, imperative description of the change.

## Pull Request (PR) Process

1.  **Create a feature branch** from `develop`.
2.  **Implement the feature** and commit your changes using the Conventional Commits format.
3.  **Create a pull request** to merge your feature branch into `develop`.
4.  **The PR must pass all CI checks** (linting, testing, etc.).
5.  **The PR must be reviewed and approved** by at least one other engineer.
6.  **Once approved, the PR can be merged** into `develop`.

## Alignment with Version Map and Readiness Reviews

- **Version Map:** Each version in the version map will correspond to a `release` branch. For example, when we are ready to release `v1.1`, we will create a `release/v1.1` branch from `develop`.
- **Readiness Reviews:** The `RELEASE_READINESS_CHECKLIST.md` will be completed as part of the `release` branch process. The release will not be merged into `main` until the checklist is signed off.
