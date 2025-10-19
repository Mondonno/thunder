# Thunder

Thunder is a VS Code extension that allows you to code at the speed of your plan with the help of GitHub Copilot. It turns a high-level development plan into parallelizable tasks, spins up Git worktrees for each task, and guides GitHub Copilot agents through execution and review.

## Getting Started

Follow these steps to install and start using Thunder in Visual Studio Code or VS Code Insiders.

### Prerequisites

- Visual Studio Code (or VS Code Insiders) installed
- GitHub Copilot extension installed and signed in
- A Git repository workspace (the extension works within Git repos)

### Installation

1. **Download the Extension**: Since Thunder is in development, download the `.vsix` package from the project's releases or build it locally using `npx vsce package` if you're contributing.
2. **Install from VSIX**:
   - Open VS Code or VS Code Insiders.
   - Go to the Extensions view (Ctrl+Shift+X).
   - Click the "..." menu in the top-right and select "Install from VSIX...".
   - Select the downloaded `.vsix` file and install it.
3. **Reload VS Code**: After installation, reload the window (Ctrl+Shift+P > "Developer: Reload Window") to activate the extension.

### Usage

1. **Open a Git Repository**: Ensure you're in a workspace that is a Git repository.
2. **Access the Command**:
   - Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P on Mac).
   - Type and select "Thunder: Execute Plan with Copilot Agents".
3. **Enter Your Plan**: Provide a high-level development plan when prompted.
4. **Approve Tasks**: Review and approve the generated tasks in the dashboard.
5. **Monitor Execution**: The extension will create worktrees, execute tasks with Copilot agents, and provide a review panel.
6. **Merge Changes**: Approve and merge completed worktrees back to the main branch.

For more details on configuration and features, see the sections below.

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

- `Thunder: Execute Plan with Copilot Agents` (`thunder.executePlan`)

Launching the command walks you through plan entry, task approval, dependency-aware execution, and review.

## Configuration

| Setting | Description | Default |
| --- | --- | --- |
| `thunder.defaultModel` | Default model to use when Copilot doesn’t suggest one. | `gpt-4` |
| `thunder.worktreeDirectory` | Where Git worktrees are created. Relative paths resolve from the workspace root. | `../worktrees` |
| `thunder.maxParallelTasks` | Maximum number of tasks executed concurrently. | `3` |
| `thunder.autoMerge` | Merge approved worktrees automatically without manual review. | `false` |

## Development Workflow

1. Run `npm install` to fetch dependencies.
2. Compile TypeScript: `npm run compile` (also exposed through the `npm: compile` build task).
3. Press `F5` to launch the Extension Development Host.
4. Use the command palette entry to provide a plan and monitor Copilot-driven execution.
5. Package for distribution with `npx vsce package` (requires the `vsce` CLI).

## Testing

Thunder includes comprehensive tests to ensure proper activation and command registration:

- **Extension Activation Tests** (`src/test/activation.test.ts`): Verifies the extension activates correctly, command registration succeeds, and error handling works without a workspace open.
- **Task Manager Tests** (`src/test/taskManager.test.ts`): Exercises the heuristic task splitter and task dependency resolution.

Run tests with:
```bash
npm test
```

Or use the VS Code Test Explorer after compiling with `npm run compile`.

## Troubleshooting

**Command not found after installation**: 
- Ensure GitHub Copilot extension is installed and signed in
- Reload VS Code (Ctrl+Shift+P > "Developer: Reload Window")
- Check the "Thunder" output channel for activation logs
- Verify the extension is listed as "Active" in Extensions view

## Release Notes

### 0.0.1

- Initial preview of the automated Copilot task orchestration workflow
- Improved error handling and logging during extension activation
- Comprehensive test coverage for command registration and activation
