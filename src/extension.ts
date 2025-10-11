// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TaskManager, Task } from './taskManager';
import { GitManager } from './gitManager';
import { CopilotManager, TaskResult } from './copilotManager';
import { Logger } from './logger';

let logger: Logger | undefined;

export function activate(context: vscode.ExtensionContext) {
	logger = new Logger();
	context.subscriptions.push(logger);

	const disposable = vscode.commands.registerCommand('copilot-task-manager.executePlan', async () => {
		if (!logger) {
			return;
		}

		try {
			const taskManager = new TaskManager(logger);
			const gitManager = new GitManager(logger);
			const copilotManager = new CopilotManager(logger);
			await executePlanWorkflow(taskManager, gitManager, copilotManager, logger);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.log(`Failed to execute plan: ${message}`, 'error');
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	logger?.dispose();
	logger = undefined;
}

async function executePlanWorkflow(
	taskManager: TaskManager,
	gitManager: GitManager,
	copilotManager: CopilotManager,
	log: Logger
): Promise<void> {
	const plan = await vscode.window.showInputBox({
		prompt: 'Enter your development plan',
		placeHolder: 'e.g., Add authentication, improve error handling, optimize database queries'
	});

	if (!plan) {
		log.log('Plan entry cancelled by user.', 'warn');
		return;
	}

	const tasks = await taskManager.splitPlanIntoTasks(plan);
	if (tasks.length === 0) {
		vscode.window.showWarningMessage('Copilot Task Manager could not identify actionable tasks.');
		return;
	}

	const approvedTasks = await taskManager.getUserApproval(tasks);
	if (!approvedTasks || approvedTasks.length === 0) {
		log.log('No tasks approved for execution.', 'warn');
		return;
	}

	let dependencyLevels: Task[][];
	try {
		dependencyLevels = taskManager.resolveDependencies(approvedTasks);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		log.log(message, 'error');
		return;
	}

	const config = vscode.workspace.getConfiguration('copilotTaskManager');
	const maxParallel = Math.max(1, config.get<number>('maxParallelTasks', 3));
	const autoMerge = config.get<boolean>('autoMerge', false);

	for (const levelTasks of dependencyLevels) {
		const results = await executeTasksInParallel(levelTasks, gitManager, copilotManager, maxParallel, log);
		await handleTaskResults(results, gitManager, copilotManager, autoMerge, log);
	}
}

async function executeTasksInParallel(
	tasks: Task[],
	gitManager: GitManager,
	copilotManager: CopilotManager,
	maxParallel: number,
	log: Logger
): Promise<TaskResult[]> {
	const results: TaskResult[] = [];

	for (let index = 0; index < tasks.length; index += maxParallel) {
		const chunk = tasks.slice(index, index + maxParallel);

		// Limit concurrent execution to avoid overwhelming local resources.
		const chunkResults = await Promise.all(chunk.map(async (task) => {
			try {
				const worktreePath = await gitManager.createWorktree(task);
				await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(worktreePath), { forceNewWindow: true });
				return await copilotManager.executeTask(task, worktreePath);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				log.log(`Task ${task.id} failed: ${message}`, 'error');
				return {
					task,
					success: false,
					error: message,
					changedFiles: []
				};
			}
		}));

		results.push(...chunkResults);
	}

	return results;
}

async function handleTaskResults(
	results: TaskResult[],
	gitManager: GitManager,
	copilotManager: CopilotManager,
	autoMerge: boolean,
	log: Logger
): Promise<void> {
	for (const result of results) {
		if (!result.success) {
			log.log(`Task ${result.task.id} reported an error: ${result.error ?? 'Unknown error'}`, 'error');
			continue;
		}

		let approved = autoMerge;
		if (!autoMerge) {
			approved = await copilotManager.reviewTaskResult(result);
		}

		if (approved) {
			try {
				await gitManager.mergeWorktree(result.task);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				log.log(`Failed to merge worktree for ${result.task.branch}: ${message}`, 'error');
			}
		} else {
			log.log(`Task ${result.task.id} requires manual follow-up.`, 'warn');
		}
	}
}
