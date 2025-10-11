# Agents

This document describes the AI agents used in Thunder and development guidelines.

## GitHub Copilot Agents

Thunder leverages GitHub Copilot agents to execute development tasks in parallel worktrees. The agents are guided by task-specific prompts and automatically collect change summaries for review.

### Agent Workflow

1. **Task Planning**: The task manager splits user plans into actionable tasks
2. **Worktree Creation**: Git worktrees are created for each approved task
3. **Agent Execution**: Copilot agents execute tasks in isolated environments
4. **Review & Merge**: Changes are reviewed and merged back to main

### Configuration

Agents use the following configuration settings:
- `thunder.defaultModel`: Default AI model (default: gpt-4)
- `thunder.maxParallelTasks`: Maximum concurrent tasks (default: 3)

## Development Guidelines

### Conventional Commits

All commits should follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

**Examples:**
- `feat: add user authentication`
- `fix: resolve memory leak in task manager`
- `docs: update README with new configuration options`