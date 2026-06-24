import { generateBriefDocument, parseBriefToScope } from './src/lib/brief-builder';

const md = generateBriefDocument({
  raw_request: 'Test request\nLine 2',
  project_type: 'เว็บไซต์บริษัท',
  project: 'PROJ-04',
  client: 'CLI-04',
  projectName: 'Parse Test',
});

console.log("Markdown:\n", md.substring(0, 300));
console.log("Parsed:\n", parseBriefToScope(md));
