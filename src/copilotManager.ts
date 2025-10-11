import * as vscode from 'vscode';
import { Task } from './taskManager';
import { Logger } from './logger';

export interface TaskResult {
    task: Task;
    success: boolean;
    error: string | null;
    changedFiles: string[];
}

export class CopilotManager {
    constructor(private readonly logger: Logger) {}

    async executeTask(task: Task, worktreePath: string): Promise<TaskResult> {
        try {
            const prompt = this.buildTaskPrompt(task);
            await vscode.commands.executeCommand('workbench.action.chat.open', prompt);
            await vscode.commands.executeCommand('workbench.action.chat.newEditsSession');
            return await this.monitorTaskExecution(task, worktreePath);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.log(`Copilot execution failed for ${task.id}: ${message}`, 'error');
            return {
                task,
                success: false,
                error: message,
                changedFiles: []
            };
        }
    }

    async reviewTaskResult(result: TaskResult): Promise<boolean> {
        const panel = vscode.window.createWebviewPanel(
            'taskReview',
            `Review: ${result.task.description}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getReviewHTML(result);

        return new Promise((resolve) => {
            const disposable = panel.webview.onDidReceiveMessage((message: { command: string; }) => {
                resolve(message.command === 'approve');
                panel.dispose();
            });

            panel.onDidDispose(() => disposable.dispose());
        });
    }

    private buildTaskPrompt(task: Task): string {
        return `#copilotCodingAgent Please complete the following task:\n\nTask: ${task.description}\nComplexity: ${task.estimatedComplexity}\nBranch: ${task.branch}\n\nInstructions:\n1. Analyze the current codebase\n2. Implement the required changes\n3. Add appropriate tests\n4. Ensure code quality and consistency\n5. Document any significant changes\n\nWhen complete, please provide a summary of:\n- Files modified\n- Key changes made\n- Any potential issues or considerations`;
    }

    private async monitorTaskExecution(task: Task, worktreePath: string): Promise<TaskResult> {
        const changedFiles = new Set<string>();
        const pattern = new vscode.RelativePattern(worktreePath, '**/*');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);

        this.logger.log(`Monitoring Copilot activity for ${task.id} in ${worktreePath}.`);

        return new Promise((resolve) => {
            let completed = false;
            const finalize = () => {
                if (completed) {
                    return;
                }
                completed = true;
                watcher.dispose();
                resolve({
                    task,
                    success: true,
                    error: null,
                    changedFiles: Array.from(changedFiles)
                });
            };

            const timeout = setTimeout(finalize, 30000);

            const handleEvent = (uri: vscode.Uri) => {
                changedFiles.add(uri.fsPath);
                clearTimeout(timeout);
                finalize();
            };

            watcher.onDidChange(handleEvent);
            watcher.onDidCreate(handleEvent);
            watcher.onDidDelete(handleEvent);
        });
    }

    private getReviewHTML(result: TaskResult): string {
        const fileList = result.changedFiles.map(file => `<li>${this.escapeHtml(file)}</li>`).join('');
        const status = result.success ? 'Success' : 'Failed';

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: var(--vscode-font-family); padding: 16px; }
                ul { padding-left: 20px; }
                button { margin-right: 8px; }
            </style>
        </head>
        <body>
            <h2>Task Review: ${this.escapeHtml(result.task.description)}</h2>
            <p>Status: ${status}</p>
            <h3>Changed Files</h3>
            <ul>${fileList}</ul>
            <div>
                <button id="approve">Approve & Merge</button>
                <button id="reject">Reject</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('approve')?.addEventListener('click', () => {
                    vscode.postMessage({ command: 'approve' });
                });
                document.getElementById('reject')?.addEventListener('click', () => {
                    vscode.postMessage({ command: 'reject' });
                });
            </script>
        </body>
        </html>
        `;
    }

    private escapeHtml(value: string): string {
        return value.replace(/[&<>'"]/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char] ?? char));
    }
}
