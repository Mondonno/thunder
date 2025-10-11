import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Manifest', () => {
    test('declares execute plan command contribution', () => {
        const extension = vscode.extensions.all.find(ext => ext.packageJSON?.name === 'copilot-task-manager');
        assert.ok(extension, 'Extension metadata should be available.');

        const commands = extension?.packageJSON?.contributes?.commands ?? [];
        const found = commands.some((command: { command: string }) => command.command === 'copilot-task-manager.executePlan');
        assert.ok(found, 'Command contribution missing from package.json.');
    });
});
