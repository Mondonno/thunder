import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';
import { Task } from './taskManager';
import { Logger } from './logger';

export class GitManager {
    private readonly workspaceRoot: string;
    private readonly git: SimpleGit;
    private readonly worktreeDir: string;

    constructor(private readonly logger: Logger) {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
        if (!this.workspaceRoot) {
            throw new Error('Workspace root is not available. Open a folder before running Copilot Task Manager.');
        }

        this.git = simpleGit(this.workspaceRoot);
        this.worktreeDir = this.resolveWorktreeRoot();
    }

    async createWorktree(task: Task): Promise<string> {
        const worktreePath = this.getWorktreePath(task);

        await this.ensureWorktreeBase();

        try {
            await this.git.raw(['worktree', 'add', worktreePath, '-b', task.branch]);
            this.logger.log(`Created worktree for ${task.description} at ${worktreePath}.`);
            return worktreePath;
        } catch (error) {
            this.logger.log(`Failed to create worktree for ${task.branch}: ${error}`, 'error');
            throw error;
        }
    }

    async mergeWorktree(task: Task): Promise<void> {
        const worktreePath = this.getWorktreePath(task);
        try {
            await this.git.checkout('main');
            await this.git.merge([task.branch]);
            await this.git.branch(['-d', task.branch]);
            await this.git.raw(['worktree', 'remove', worktreePath]);
            await this.safeRemoveDirectory(worktreePath);
            this.logger.log(`Merged and cleaned up worktree for ${task.branch}.`);
        } catch (error) {
            this.logger.log(`Failed to merge worktree ${task.branch}: ${error}`, 'error');
            throw error;
        }
    }

    async getCurrentBranch(): Promise<string> {
        try {
            return (await this.git.revparse(['--abbrev-ref', 'HEAD'])).trim();
        } catch (error) {
            this.logger.log(`Unable to determine current branch: ${error}`, 'error');
            throw error;
        }
    }

    private resolveWorktreeRoot(): string {
        const configured = vscode.workspace
            .getConfiguration('thunder')
            .get<string>('worktreeDirectory', '../worktrees');

        const candidate = configured ?? '../worktrees';
        return path.isAbsolute(candidate)
            ? candidate
            : path.resolve(this.workspaceRoot, candidate);
    }

    private getWorktreePath(task: Task): string {
        return path.resolve(this.worktreeDir, task.branch.replace(/\s+/g, '-'));
    }

    private async ensureWorktreeBase(): Promise<void> {
        await fs.mkdir(this.worktreeDir, { recursive: true });
    }

    private async safeRemoveDirectory(targetPath: string): Promise<void> {
        try {
            await fs.rm(targetPath, { recursive: true, force: true });
        } catch (error) {
            this.logger.log(`Failed to remove worktree directory ${targetPath}: ${error}`, 'warn');
        }
    }
}
