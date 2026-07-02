import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../..');
const readText = (path: string) => readFileSync(resolve(root, path), 'utf8');
const readJson = <T = any>(path: string): T => JSON.parse(readText(path));

describe('ScopeFlow Release QA V0.8 static checks', () => {
  it('keeps fresh checkout scripts available', () => {
    const pkg = readJson<{ scripts: Record<string, string> }>('package.json');

    expect(pkg.scripts.test).toBe('vitest run');
    expect(pkg.scripts.build).toContain('vite build');
    expect(pkg.scripts.tauri).toBe('tauri');
    expect(pkg.scripts['tauri:dev']).toBe('tauri dev');
    expect(pkg.scripts['release:check']).toContain('npm run test');
    expect(pkg.scripts['release:check']).toContain('npm run build');
    expect(pkg.scripts['release:check']).toContain('cargo test');
  });

  it('keeps Tauri dev/build config portable for local desktop', () => {
    const config = readJson<any>('src-tauri/tauri.conf.json');

    expect(config.productName).toContain('ScopeFlow');
    expect(config.build.beforeDevCommand).toBe('npm run dev');
    expect(config.build.devUrl).toBe('http://localhost:1420');
    expect(config.build.beforeBuildCommand).toBe('npm run build');
    expect(config.build.frontendDist).toBe('../dist');
    expect(JSON.stringify(config)).not.toContain('/Users/');
    expect(JSON.stringify(config)).not.toContain('C:\\');
  });

  it('documents V0.8 release limitations and next wave clearly', () => {
    const releaseNotes = readText('docs/RELEASE_NOTES_V0.8.md');
    const checklist = readText('docs/scopeflow-release-qa-v0.8-checklist.md');

    expect(releaseNotes).toContain('local-first guided scope flow baseline');
    expect(releaseNotes).toContain('ยังไม่ใช่ production cloud/deploy');
    expect(releaseNotes).toContain('Approval Evidence Capture UX');
    expect(releaseNotes).toContain('E2E Tauri Harness');
    expect(releaseNotes).toContain('Export / Package Polish');
    expect(checklist).toContain('npm run tauri dev');
    expect(checklist).toContain('approved/locked Scope ไม่ถูกเขียนทับเงียบ ๆ');
  });

  it('does not keep stale no-AI release messaging in the active README', () => {
    const readme = readText('README.md');

    expect(readme).toContain('ScopeFlow V0.8 รองรับ AI-assisted flow แบบ optional');
    expect(readme).not.toContain('ปัญญาประดิษฐ์ (AI)');
    expect(readme).not.toContain('No AI Assistance');
  });
});
