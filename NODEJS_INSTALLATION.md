# Node.js Installation Guide for Windows

## Problem
Node.js is not installed on your system. You need to install Node.js before you can run this project.

## Solution: Install Node.js

### Option 1: Official Installer (Recommended)

1. **Download Node.js:**
   - Go to: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Run the Installer:**
   - Double-click the downloaded `.msi` file
   - Follow the installation wizard
   - **Important:** Make sure to check "Add to PATH" during installation
   - Click "Next" through all steps
   - Click "Install" and wait for completion

3. **Verify Installation:**
   - Open a **new** PowerShell or Command Prompt window (important: close and reopen)
   - Run these commands:
     ```powershell
     node --version
     npm --version
     ```
   - You should see version numbers (e.g., v18.17.0 and 9.6.7)

### Option 2: Using Chocolatey (If you have it)

If you have Chocolatey package manager installed:
```powershell
choco install nodejs-lts
```

### Option 3: Using Winget (Windows 10/11)

If you have Windows Package Manager (winget):
```powershell
winget install OpenJS.NodeJS.LTS
```

## After Installing Node.js

1. **Close and reopen your terminal/IDE** (important for PATH to update)

2. **Verify installation:**
   ```powershell
   node --version
   npm --version
   ```

3. **Install project dependencies:**
   ```powershell
   cd C:\Users\kanis\blooddonation
   npm run install:all
   ```

## Troubleshooting

### "node is not recognized" after installation
- **Solution:** Close and reopen your terminal/IDE completely
- If still not working, restart your computer
- Check if Node.js is in PATH: Open System Properties → Environment Variables → Check PATH includes Node.js installation directory (usually `C:\Program Files\nodejs\`)

### Installation fails
- Make sure you have administrator privileges
- Try downloading the installer again
- Check Windows Defender/Antivirus isn't blocking the installation

### Wrong version
- Make sure you download the LTS version (recommended for stability)
- Current LTS version is usually v18.x or v20.x

## What Node.js Version Do You Need?

- **Minimum:** Node.js v18.0.0 or higher
- **Recommended:** Latest LTS version (v20.x or v18.x)

## Next Steps After Installation

Once Node.js is installed:

1. Install project dependencies:
   ```powershell
   npm run install:all
   ```

2. Set up the database (see SETUP.md)

3. Run the application:
   ```powershell
   npm run dev
   ```

## Need Help?

- Node.js Official Docs: https://nodejs.org/en/docs/
- Node.js Download: https://nodejs.org/en/download/
