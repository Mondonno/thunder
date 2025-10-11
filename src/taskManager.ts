import * as vscode from 'vscode';
import { Logger } from './logger';

export type TaskComplexity = 'low' | 'medium' | 'high';

export interface Task {
    id: string;
    description: string;
    estimatedComplexity: TaskComplexity;
    suggestedModel: string;
    branch: string;
    dependencies: string[];
}

export class TaskManager {
    constructor(private readonly logger: Logger) {}

    async splitPlanIntoTasks(plan: string): Promise<Task[]> {
        if (!plan.trim()) {
            return [];
        }

        const prompt = this.buildPrompt(plan);
        let response: unknown;
        try {
            response = await vscode.commands.executeCommand('workbench.action.chat.open', prompt);
        } catch (error) {
            this.logger.log(`Unable to contact Copilot Chat: ${error}`, 'warn');
        }

        const parsedTasks = this.parseTasksFromResponse(response);
        if (parsedTasks.length > 0) {
            this.logger.log(`Generated ${parsedTasks.length} task(s) from Copilot response.`);
            return this.ensureTaskDefaults(parsedTasks);
        }

        const fallback = this.fallbackTasksFromPlan(plan);
        this.logger.log('Falling back to heuristic task split.', 'warn');
        return this.ensureTaskDefaults(fallback);
    }

    async getUserApproval(tasks: Task[]): Promise<Task[] | null> {
        if (tasks.length === 0) {
            vscode.window.showWarningMessage('No tasks available for approval.');
            return null;
        }

        const panel = vscode.window.createWebviewPanel(
            'taskApproval',
            'Task Approval',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getTaskApprovalHTML(tasks);

        return new Promise((resolve) => {
            let completed = false;
            const finish = (value: Task[] | null) => {
                if (completed) {
                    return;
                }
                completed = true;
                resolve(value);
            };

            const disposable = panel.webview.onDidReceiveMessage((message: { command: string; tasks: string[]; }) => {
                if (message.command === 'approve') {
                    const selected = tasks.filter(task => message.tasks.includes(task.id));
                    finish(selected);
                } else {
                    finish(null);
                }
                panel.dispose();
            });

            panel.onDidDispose(() => {
                disposable.dispose();
                finish(null);
            });
        });
    }

    resolveDependencies(tasks: Task[]): Task[][] {
        const levels: Task[][] = [];
        const processed = new Set<string>();
        const taskMap = new Map(tasks.map(task => [task.id, task] as const));

        while (processed.size < tasks.length) {
            const currentLevel = tasks.filter(task => {
                if (processed.has(task.id)) {
                    return false;
                }
                return task.dependencies.every(dep => processed.has(dep));
            });

            if (currentLevel.length === 0) {
                throw new Error('Circular dependency detected in task list.');
            }

            currentLevel.forEach(task => processed.add(task.id));
            levels.push(currentLevel.map(task => taskMap.get(task.id) ?? task));
        }

        return levels;
    }

    private ensureTaskDefaults(tasks: Task[]): Task[] {
        return tasks.map((task, index) => {
            const sanitizedId = (task.id || `task-${index + 1}`).replace(/\s+/g, '-');
            const branch = (task.branch || `feature/${sanitizedId}`).replace(/\s+/g, '-');
            const complexity = task.estimatedComplexity ?? 'medium';
            const enrichedTask: Task = {
                ...task,
                id: sanitizedId,
                branch,
                estimatedComplexity: complexity,
                suggestedModel: task.suggestedModel ?? '',
                dependencies: Array.isArray(task.dependencies) ? task.dependencies : []
            };
            const suggestedModel = enrichedTask.suggestedModel || this.selectOptimalModel(enrichedTask);

            return { ...enrichedTask, suggestedModel };
        });
    }

    private buildPrompt(plan: string): string {
        return `Analyze this development plan and split it into independent, parallelizable tasks:\n"${plan}"\n\nFor each task, provide:\n1. Clear description\n2. Complexity estimate (low/medium/high)\n3. Suggested AI model based on complexity\n4. Any dependencies on other tasks\n\nReturn as JSON array with structure:\n{\n    "id": "task-1",\n    "description": "Task description",\n    "estimatedComplexity": "medium",\n    "suggestedModel": "gpt-4",\n    "branch": "feature/task-1",\n    "dependencies": []\n}`;
    }

    private parseTasksFromResponse(response: unknown): Task[] {
        if (!response) {
            return [];
        }

        const attemptParse = (value: string): Task[] => {
            try {
                const trimmed = value.trim();
                const jsonStart = trimmed.indexOf('[');
                const jsonEnd = trimmed.lastIndexOf(']');
                if (jsonStart === -1 || jsonEnd === -1) {
                    return [];
                }
                const candidate = trimmed.slice(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(candidate) as Partial<Task>[];
                return parsed.filter(item => typeof item?.description === 'string').map(item => ({
                    id: item.id ?? '',
                    description: item.description ?? '',
                    estimatedComplexity: (item.estimatedComplexity as TaskComplexity) ?? 'medium',
                    suggestedModel: item.suggestedModel ?? '',
                    branch: item.branch ?? '',
                    dependencies: Array.isArray(item.dependencies) ? item.dependencies : []
                }));
            } catch (error) {
                this.logger.log(`Failed to parse Copilot response: ${error}`, 'warn');
                return [];
            }
        };

        if (typeof response === 'string') {
            return attemptParse(response);
        }

        if (Array.isArray(response)) {
            return response as Task[];
        }

        if (typeof response === 'object') {
            const textValue = (response as { value?: string }).value;
            if (typeof textValue === 'string') {
                return attemptParse(textValue);
            }
        }

        return [];
    }

    private fallbackTasksFromPlan(plan: string): Task[] {
        const segments = plan
            .split(/\.|\n|;/g)
            .map(segment => segment.trim())
            .filter(Boolean);

        if (segments.length === 0) {
            return [
                {
                    id: 'task-1',
                    description: plan.trim(),
                    estimatedComplexity: 'medium',
                    suggestedModel: 'gpt-4',
                    branch: 'feature/task-1',
                    dependencies: []
                }
            ];
        }

        return segments.map((segment, index) => ({
            id: `task-${index + 1}`,
            description: segment,
            estimatedComplexity: segment.length > 100 ? 'high' : 'medium',
            suggestedModel: '',
            branch: '',
            dependencies: []
        }));
    }

    private selectOptimalModel(task: Task): string {
        const modelMap: Record<TaskComplexity, string> = {
            low: 'gpt-3.5-turbo',
            medium: 'gpt-4',
            high: 'gpt-4-turbo'
        };

        return modelMap[task.estimatedComplexity] ?? 'gpt-4';
    }

    private getTaskApprovalHTML(tasks: Task[]): string {
    const taskData = JSON.stringify(tasks).replace(/</g, '\\u003c');
        const taskCards = tasks.map(task => `
            <div class="task-card complexity-${task.estimatedComplexity}">
                <h3>${this.escapeHtml(task.description)}</h3>
                <p><strong>Complexity:</strong> ${this.escapeHtml(task.estimatedComplexity)}</p>
                <p><strong>Model:</strong> ${this.escapeHtml(task.suggestedModel)}</p>
                <p><strong>Branch:</strong> ${this.escapeHtml(task.branch)}</p>
                <label>
                    <input type="checkbox" data-task-id="${this.escapeHtml(task.id)}" checked />
                    Include this task
                </label>
            </div>
        `).join('');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: var(--vscode-font-family); padding: 16px; }
                .task-card { border: 1px solid var(--vscode-editorWidget-border); margin-bottom: 12px; padding: 12px; border-radius: 4px; }
                .task-card h3 { margin-top: 0; }
                .complexity-high { border-left: 4px solid #d13438; }
                .complexity-medium { border-left: 4px solid #f7630c; }
                .complexity-low { border-left: 4px solid #107c10; }
                button { margin-right: 8px; }
            </style>
        </head>
        <body>
            <h2>Task Breakdown Approval</h2>
            ${taskCards}
            <div>
                <button id="approve">Approve & Execute</button>
                <button id="cancel">Cancel</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const tasks = ${taskData};
                const getSelectedTaskIds = () => Array.from(document.querySelectorAll('input[data-task-id]:checked')).map(cb => cb.dataset.taskId);
                document.getElementById('approve')?.addEventListener('click', () => {
                    vscode.postMessage({ command: 'approve', tasks: getSelectedTaskIds() });
                });
                document.getElementById('cancel')?.addEventListener('click', () => {
                    vscode.postMessage({ command: 'cancel', tasks: [] });
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
