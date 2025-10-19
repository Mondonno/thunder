import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation and Command Registration', () => {
    test('extension should be available', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        assert.ok(extension, 'Thunder extension should be available.');
    });

    test('extension should activate successfully', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        assert.ok(extension, 'Extension should exist');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }
        
        assert.ok(extension?.isActive, 'Extension should be active after activation.');
    });

    test('extension should register thunder.executePlan command', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        // Try to execute the command to verify it's registered
        try {
            // We use getCommands which requires the command to be registered
            const allCommands = await vscode.commands.getCommands(true);
            const found = allCommands.includes('thunder.executePlan');
            assert.ok(found, 'Command "thunder.executePlan" should be registered');
        } catch (error) {
            assert.fail(`Failed to verify command registration: ${error}`);
        }
    });

    test('declares execute plan command contribution in package.json', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        assert.ok(extension, 'Extension metadata should be available.');

        const commands = extension?.packageJSON?.contributes?.commands ?? [];
        const found = commands.some((command: { command: string }) => command.command === 'thunder.executePlan');
        assert.ok(found, 'Command contribution "thunder.executePlan" missing from package.json.');
    });

    test('should list thunder command in contributes section', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        const commands = extension?.packageJSON?.contributes?.commands ?? [];
        
        assert.ok(commands.length > 0, 'Extension should have at least one command contribution.');
        
        const thunderCommand = commands.find((cmd: { command: string }) => cmd.command === 'thunder.executePlan');
        assert.ok(thunderCommand, 'Thunder command should exist in contributions');
        assert.strictEqual(thunderCommand.category, 'Thunder', 'Command should have Thunder category');
        assert.ok(thunderCommand.title, 'Command should have a title');
    });

    test('extension activation event should be onCommand:thunder.executePlan', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        const activationEvents = extension?.packageJSON?.activationEvents ?? [];
        
        const found = activationEvents.some((event: string) => event === 'onCommand:thunder.executePlan');
        assert.ok(found, 'Activation event "onCommand:thunder.executePlan" should be in package.json.');
    });

    test('main entry point should be ./out/extension.js', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        const main = extension?.packageJSON?.main;
        
        assert.strictEqual(main, './out/extension.js', 'Main entry point should be ./out/extension.js');
    });
});

suite('Extension Configuration', () => {
    test('should have Thunder configuration properties', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        const config = extension?.packageJSON?.contributes?.configuration ?? {};
        const properties = (config as { properties?: Record<string, unknown> }).properties ?? {};
        
        assert.ok(Object.keys(properties).includes('thunder.defaultModel'), 'Configuration should include thunder.defaultModel');
        assert.ok(Object.keys(properties).includes('thunder.maxParallelTasks'), 'Configuration should include thunder.maxParallelTasks');
        assert.ok(Object.keys(properties).includes('thunder.autoMerge'), 'Configuration should include thunder.autoMerge');
        assert.ok(Object.keys(properties).includes('thunder.worktreeDirectory'), 'Configuration should include thunder.worktreeDirectory');
    });
});
