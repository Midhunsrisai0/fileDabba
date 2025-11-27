# FileDabba — Notes

A concise README for managing notes and file/folder creation rules.

## Table of contents

- Overview
- Guidelines
- Usage
- Contributing
- License

## Overview

This repository stores short operational notes related to file and folder management. The intent is to document best practices and constraints to follow when adding or modifying entries.

## Guidelines

- Ensure new folders do not conflict with existing folder names at the same parent level.
- Ensure new files use a unique name among files in the same parent directory.
- Adopt a consistent naming convention (lowercase, hyphens or underscores, avoid special characters).
- Consider case-sensitivity and normalization rules of the target filesystem.
- Validate names before creation and provide clear error messages on conflict.

## Current facing problems ( non blockers )

### Dirty delete `issue fixed ✅`

- **Issue**: When folder deletion fails partway through (due to network issues, crashes, etc.), the filesystem and database can become out of sync
- **Impact**: Orphaned records in database or orphaned files/folders on disk
- **Proposed Solution**:
  - Implement cascade delete in Prisma schema (added in migration `20251127165024_add_cascade_delete`)
  - Use database transactions where possible
  - Add cleanup/reconciliation job to detect and fix inconsistencies
  1. Before deleting, save data to another cache
  2. After data deletion completes, records in database will start deleting
  3. if this fails for some reason, we restore the deleted data from the saved cache

## TODOS

- Need to implement a function that when invoked, gets all files from database and deletes the files in the filesystem that are not in the database to ensure sync
- Learn more about cloudfare secure tunnel

## Usage

- Read the guidelines before adding new files or folders.
- Use automated checks (scripts or CI) to enforce uniqueness and naming rules where possible.

## Contributing

- Open issues for proposed changes to guidelines.
- Submit PRs with clear descriptions and tests for validation scripts.
