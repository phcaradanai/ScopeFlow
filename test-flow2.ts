import { generateBriefDocument, parseBriefToScope } from './src/lib/brief-builder';

const md = generateBriefDocument({
  raw_request: 'Test request\nLine 2',
  project_type: 'เว็บไซต์บริษัท',
  project: 'PROJ-04',
  client: 'CLI-04',
  projectName: 'Parse Test',
});

const regex = /## 1\. คำขอลูกค้าต้นฉบับ \(Raw Request\)\n+> ([\s\S]*?)(\n## 2|\n*$)/;
console.log(md.match(regex));
