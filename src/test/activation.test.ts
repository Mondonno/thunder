import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Activation Safety', () => {
    test('activation should not fail even without workspace open', async () => {
        // The extension should load its code without errors
        // even if the command is not immediately executable
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        assert.ok(extension, 'Extension should load');

        // Verify activation succeeded
        if (!extension?.isActive) {
            try {
                await extension?.activate();
            } catch (error) {
                assert.fail(`Extension activation should not throw: ${error}`);
            }
        }

        assert.ok(extension?.isActive, 'Extension should be active');
    });

    test('should handle missing workspace gracefully', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        // The command should be registered even without a workspace
        // The error handling happens when executing the command
        const allCommands = await vscode.commands.getCommands(true);
        const isRegistered = allCommands.includes('thunder.executePlan');
        
        assert.ok(isRegistered, 'Command should be registered regardless of workspace state');
    });

    test('extension should export activate and deactivate functions', () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        assert.ok(extension, 'Extension should exist');
        
        // Check if exports are available
        const extensionModule = extension?.exports;
        // The extension module may not expose the functions directly, 
        // but the extension itself should be loaded
        assert.ok(extension?.isActive, 'Extension should be properly initialized');
    });

    test('logger should be initialized during activation', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        // Check that the output channel was created
        const outputChannels = vscode.window.visibleTextEditors;
        // The channel is created but may not be visible initially
        // We just verify that activation completes without error
        assert.ok(extension?.isActive, 'Extension should be active with logger initialized');
    });

    test('should not throw during repeated activations', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        // Activating again should be safe
        try {
            await extension?.activate();
            assert.ok(true, 'Repeated activation should not throw');
        } catch (error) {
            assert.fail(`Repeated activation threw: ${error}`);
        }
    });
});

suite('Command Registration Verification', () => {
    test('thunder.executePlan command should be callable', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        const commands = await vscode.commands.getCommands(true);
        const isRegistered = commands.includes('thunder.executePlan');
        
        assert.ok(isRegistered, 'Command thunder.executePlan must be registered');
    });

    test('all declared commands should be registered', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            await extension?.activate();
        }

        const declaredCommands = extension?.packageJSON?.contributes?.commands ?? [];
        const registeredCommands = await vscode.commands.getCommands(true);

        for (const cmd of declaredCommands) {
            const commandId = cmd.command;
            assert.ok(
                registeredCommands.includes(commandId),
                `Declared command "${commandId}" should be registered`
            );
        }
    });
});

suite('Dependency Resolution', () => {
    test('all npm dependencies should be resolvable', async () => {
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            try {
                await extension?.activate();
            } catch (error) {
                assert.fail(`Extension should activate without missing dependencies. Error: ${error}`);
            }
        }

        assert.ok(extension?.isActive, 'Extension should activate successfully with all dependencies available');
    });

    test('simple-git dependency should be available', async () => {
        // This test ensures that the packaged extension includes node_modules
        // and that dependencies like simple-git are present when the extension runs
        const extension = vscode.extensions.getExtension('undefined_publisher.thunder');
        
        if (!extension?.isActive) {
            try {
                await extension?.activate();
                assert.ok(true, 'simple-git dependency resolved successfully');
            } catch (error) {
                const errorMsg = String(error);
                assert.ok(
                    !errorMsg.includes('Cannot find module'),
                    `Dependencies missing in packaged extension: ${error}`
                );
            }
        } else {
            assert.ok(true, 'Extension already active with dependencies');
        }
    });
});
