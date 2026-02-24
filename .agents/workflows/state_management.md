---
description: Maintain Project State Document
---
# Maintain Project State Document

**Critically Important:** Before implementing any new feature, performing any refactoring, or attempting to fix a bug, you **MUST** read the `PROJECT_STATE.md` file located at the root of the project: `/Users/nk/Developer/sacred-cosmos-dashboard/PROJECT_STATE.md`.

This document contains a running log of everything that has been accomplished, how certain key features are implemented, and the current list of known bugs or blocking issues. 

## Workflow Steps:
1. **Read `PROJECT_STATE.md`**: Before doing any code analysis or writing, execute the `view_file` tool to read the contents of `PROJECT_STATE.md`. You must establish the current context.
2. **Acknowledge Findings**: Formulate your implementation plan explicitly taking into account the history and any active blocking bugs listed in the document. Ensure your approach avoids known pitfalls.
3. **Execute Task**: Proceed to execute the user's objective using standard coding tools.
4. **Update `PROJECT_STATE.md`**: Upon successful completion of a task, immediately use the `replace_file_content` or `multi_replace_file_content` tools to append new accomplishments to the state document. If you discovered or parked a new bug during your build, add it to the 'Known Bugs' section.
