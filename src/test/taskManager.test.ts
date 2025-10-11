import * as assert from 'assert';
import * as vscode from 'vscode';
import { TaskManager } from '../taskManager';
import { Logger } from '../logger';

class TestLogger extends Logger {
    constructor() {
        super('Test Logger');
    }

    override log(): void {
        // Suppress output during tests.
    }
}

suite('TaskManager', () => {
    const originalExecuteCommand = vscode.commands.executeCommand;
    const stubExecuteCommand: typeof originalExecuteCommand = async () => undefined as never;

    setup(() => {
        Reflect.set(vscode.commands, 'executeCommand', stubExecuteCommand);
    });

    teardown(() => {
        Reflect.set(vscode.commands, 'executeCommand', originalExecuteCommand);
    });

    test('fallback task generation creates entries for sentence fragments', async () => {
        const manager = new TaskManager(new TestLogger());
        const plan = 'Add user authentication. Improve error handling.';
        const tasks = await manager.splitPlanIntoTasks(plan);

        assert.ok(tasks.length >= 2, 'Expected at least two tasks generated from plan.');
        assert.ok(tasks.every(task => task.description.length > 0), 'Tasks should have descriptions.');
    });
});
