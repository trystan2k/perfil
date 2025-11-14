---
title: Task 21.3 - Skip Separate Component
type: note
permalink: development-logs/task-21-3-skip-separate-component
---

## Decision: Skip Separate Component Creation

**Reasoning:**
Following the KISS (Keep It Simple, Stupid) principle, I've decided NOT to create a separate NoGamePrompt component. Instead, I'll implement the UI directly in the game.astro file.

**Justification:**
1. The content is extremely simple (heading, description, link)
2. This is a one-off use case - the component won't be reused
3. The current game.astro already has the right structure
4. Creating a separate component would be overengineering
5. Less code to maintain
6. Faster implementation

**Implementation:**
Will add the content directly in game.astro in subtask 21.4.

**Status:** Skipped in favor of inline implementation
