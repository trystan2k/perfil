---
title: Task 6.4 - Implement Show Next Clue Button
type: note
permalink: development-logs/task-6-4-implement-show-next-clue-button
---

## Subtask 6.4: Implement 'Show Next Clue' Button for MC

**Date**: 2025-11-10

### Summary
- Status: In Progress
- Add "Show Next Clue" button that triggers nextClue action
- Disable button when max clues reached
- Show appropriate feedback when disabled

### Implementation Plan
1. Import Button component
2. Add button with onClick handler calling nextClue
3. Disable button when cluesRead >= totalCluesPerProfile
4. Add tests for button clicks and disabled state