import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Architecture & Non-Goals', () => {
  it('does not contain forbidden NPM dependencies', () => {
    const pkgPath = path.join(import.meta.dirname, '../../../package.json');
    const pkgStr = fs.readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgStr);
    
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };
    
    const depsString = JSON.stringify(allDeps).toLowerCase();
    
    const forbidden = [
      'sqlite', 'prisma', 'typeorm', 'sequelize',
      'supabase', 'firebase', 'axios', 'fetch', // No cloud/network calls needed
      'openai', 'langchain', 'llama', // No AI
      'jspdf', 'pdfmake', 'html2pdf' // No PDF export yet
    ];
    
    forbidden.forEach(dep => {
      expect(depsString, `Forbidden dependency found: ${dep}`).not.toContain(dep);
    });
  });

  it('does not contain forbidden Cargo dependencies', () => {
    const cargoPath = path.join(import.meta.dirname, '../../../src-tauri/Cargo.toml');
    const cargoStr = fs.readFileSync(cargoPath, 'utf-8').toLowerCase();
    
    // Extract [dependencies] and [build-dependencies] sections
    let depsSection = '';
    const lines = cargoStr.split('\n');
    let inDeps = false;
    for (const line of lines) {
      if (line.startsWith('[')) {
        if (line.includes('[dependencies]') || line.includes('[build-dependencies]')) {
          inDeps = true;
        } else {
          inDeps = false;
        }
      } else if (inDeps) {
        depsSection += line + '\n';
      }
    }
    
    const forbidden = [
      'rusqlite', 'sqlx', 'diesel',
      'reqwest', 'hyper', 'tokio-tungstenite', // No network client calls
      'pdf'
    ];
    
    forbidden.forEach(dep => {
      // Check for exact dependency keys or strings
      expect(depsSection, `Forbidden rust dependency found: ${dep}`).not.toContain(`${dep} `);
      expect(depsSection, `Forbidden rust dependency found: ${dep}`).not.toContain(`${dep}=`);
      expect(depsSection, `Forbidden rust dependency found: ${dep}`).not.toContain(`"${dep}"`);
    });
  });
});
