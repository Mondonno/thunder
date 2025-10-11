import * as vscode from 'vscode';

export type LogLevel = 'info' | 'warn' | 'error';

export class Logger implements vscode.Disposable {
    private readonly outputChannel: vscode.OutputChannel;

    constructor(channelName = 'Copilot Task Manager') {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    log(message: string, level: LogLevel = 'info'): void {
        const timestamp = new Date().toISOString();
        const formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        this.outputChannel.appendLine(formatted);

        if (level === 'error') {
            vscode.window.showErrorMessage(message);
        } else if (level === 'warn') {
            vscode.window.showWarningMessage(message);
        }
    }

    dispose(): void {
        this.outputChannel.dispose();
    }
}
