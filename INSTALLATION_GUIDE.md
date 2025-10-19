# Installation Guide - Thunder Extension (Fixed)

## Quick Start

### Prerequisites
- VS Code or VS Code Insiders
- GitHub Copilot extension installed and signed in
- A Git repository (extension works within Git repos)

### Step 1: Install Extension
1. Download `thunder-0.0.1.vsix` from the project directory
2. Open VS Code Extensions (Ctrl+Shift+X or Cmd+Shift+X on Mac)
3. Click the "..." menu in top-right
4. Select "Install from VSIX..."
5. Choose the `.vsix` file

### Step 2: Reload VS Code
- Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)
- Type "Developer: Reload Window" and press Enter
- Wait for reload to complete

### Step 3: Verify Installation
1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "Thunder" - you should see "Thunder: Execute Plan with Copilot Agents"
3. Check the Output panel:
   - Open View > Output
   - Select "Thunder" from the dropdown
   - You should see: `[timestamp] INFO: Thunder extension activated successfully`

### Step 4: Use the Extension
1. Open a Git repository in VS Code
2. Open Command Palette (Ctrl+Shift+P)
3. Type and select "Thunder: Execute Plan with Copilot Agents"
4. Enter your development plan when prompted
5. Review and approve generated tasks
6. Monitor execution in separate VS Code windows

## Troubleshooting

### Command Not Found
**Problem**: "Command 'thunder.executePlan' not found" error
**Solution**:
1. Ensure extension shows as "Active" in Extensions panel
2. Reload VS Code (Ctrl+Shift+P > "Developer: Reload Window")
3. Check "Thunder" output channel for errors
4. Verify GitHub Copilot extension is active

### Extension Not Activating
**Problem**: "Thunder" output channel is empty or shows errors
**Solution**:
1. Check for "simple-git" or dependency errors in output
2. Ensure VS Code version is 1.74.0 or later
3. If "Cannot find module" error: the `.vsix` file may be corrupted
   - Re-download or rebuild with `npx vsce package`

### Command Fails When Executed
**Problem**: Command runs but shows an error
**Solution**:
1. Ensure you have a Git repository open
2. Ensure you're on the `main` branch
3. Check Git is installed: run `git --version` in terminal
4. Review the full error in the "Thunder" output channel

## What's Been Fixed

✅ **Issue 1**: Command registration failure
- Enhanced error handling during activation
- Added diagnostic logging and messages
- 18 comprehensive tests verify activation

✅ **Issue 2**: Missing dependencies
- `.vscodeignore` updated to include `node_modules`
- Tests verify `simple-git` and all dependencies are packaged
- Extension size: ~713KB (includes dependencies)

## File Size
- `thunder-0.0.1.vsix`: ~713KB (includes all dependencies)
- Larger than typical extensions due to bundled `node_modules`
- Can be optimized with webpack bundling (future enhancement)

## Version Info
- Thunder: 0.0.1 (Preview)
- VS Code: 1.74.0+
- Node: 18+

## Support
- Check `BUG_FIX_REPORT.md` for detailed technical information
- See `README.md` for development workflow and configuration
- Review test files in `src/test/` for usage examples
