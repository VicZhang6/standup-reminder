import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'dev';

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
    ...options
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

function resolveVsDevCmd() {
  const candidates = [
    join(
      process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      'Microsoft Visual Studio',
      '2022',
      'BuildTools',
      'Common7',
      'Tools',
      'VsDevCmd.bat'
    ),
    join(
      process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      'Microsoft Visual Studio',
      '2022',
      'Community',
      'Common7',
      'Tools',
      'VsDevCmd.bat'
    )
  ];

  return candidates.find((path) => existsSync(path));
}

if (process.platform === 'win32') {
  const vsDevCmd = resolveVsDevCmd();

  if (vsDevCmd) {
    const command = `call "${vsDevCmd}" -arch=x64 -host_arch=x64 >nul && npx tauri ${mode}`;
    run('cmd.exe', ['/d', '/s', '/c', command]);
  } else {
    run('npx.cmd', ['tauri', mode], { shell: true });
  }
} else {
  run('npx', ['tauri', mode], { shell: true });
}
