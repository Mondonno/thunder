# Copilot Task Manager

Copilot Task Manager is a VS Code extension that turns a high-level development plan into parallelizable tasks, spins up Git worktrees for each task, and guides GitHub Copilot agents through execution and review.

## Prerequisites

- Node.js 18+
- Git 2.34.1+ with worktree support
- Visual Studio Code with the GitHub Copilot extension enabled
- TypeScript installed globally (`npm install -g typescript`)
- Yeoman + VS Code extension generator (`npm install -g yo generator-code`)

## Core Features

- Split user-provided development plans into discrete tasks using Copilot Chat prompts.
- Display an approval dashboard so you can cherry-pick the tasks to execute.
- Create Git worktrees per task and open them in dedicated VS Code windows for isolation.
- Drive Copilot Coding Agents with task-specific prompts and collect change summaries automatically.
- Monitor file activity for each worktree and surface a review panel before merge.
- Merge approved worktrees back into `main`, with optional automatic merging.

## Command Palette Entry

- `Copilot Task Manager: Execute Plan with Copilot Agents` (`copilot-task-manager.executePlan`)

Launching the command walks you through plan entry, task approval, dependency-aware execution, and review.

## Configuration

| Setting | Description | Default |
| --- | --- | --- |
| `copilotTaskManager.defaultModel` | Default model to use when Copilot doesn’t suggest one. | `gpt-4` |
| `copilotTaskManager.worktreeDirectory` | Where Git worktrees are created. Relative paths resolve from the workspace root. | `../worktrees` |
| `copilotTaskManager.maxParallelTasks` | Maximum number of tasks executed concurrently. | `3` |
| `copilotTaskManager.autoMerge` | Merge approved worktrees automatically without manual review. | `false` |

## Development Workflow

1. Run `npm install` to fetch dependencies.
2. Compile TypeScript: `npm run compile` (also exposed through the `npm: compile` build task).
3. Press `F5` to launch the Extension Development Host.
4. Use the command palette entry to provide a plan and monitor Copilot-driven execution.
5. Package for distribution with `npx vsce package` (requires the `vsce` CLI).

## Testing

- `src/test/taskManager.test.ts` exercises the heuristic task splitter. Run tests with the VS Code Test Explorer or via `npx @vscode/test-cli` after compiling.

## Release Notes

### 0.0.1

- Initial preview of the automated Copilot task orchestration workflow.
