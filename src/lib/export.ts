import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { DocumentInfo, readFileContent, writeFileContent, pathExists } from './tauri-commands';

export interface ExportDocument {
  title: string;
  content: string; // Markdown content with frontmatter stripped
}

/**
 * Strips YAML frontmatter from a markdown string.
 */
export function stripFrontmatter(markdown: string): string {
  // Regex to match YAML frontmatter between --- and --- at the start of the file
  const frontmatterRegex = /^---\n[\s\S]*?\n---\n+/;
  return markdown.replace(frontmatterRegex, '');
}

/**
 * Generates the HTML string for the export pack.
 */
export async function generateApprovalPackHtml(
  projectName: string,
  clientName: string,
  documents: ExportDocument[]
): Promise<string> {
  const dateStr = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const docListHtml = documents
    .map((doc, idx) => `<li>${idx + 1}. ${doc.title}</li>`)
    .join('\n');

  let bodyHtml = '';
  for (const doc of documents) {
    const rawHtml = await marked.parse(doc.content);
    
    // Sanitize the HTML to ensure no script injection, iframe, object, or inline handlers
    // Also strip javascript: URLs.
    const safeHtml = sanitizeHtml(rawHtml, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'input', 'del'
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        'input': ['type', 'checked', 'disabled'],
        'img': ['src', 'alt', 'title'],
        '*': ['id', 'class'] // Allow standard styling classes and heading IDs
      },
      allowedSchemes: ['http', 'https', 'ftp', 'mailto'],
      allowProtocolRelative: false,
    });

    bodyHtml += `
      <div class="document-section">
        ${safeHtml}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ชุดเอกสารขออนุมัติ: ${projectName}</title>
  <style>
    :root {
      --text-color: #333;
      --bg-color: #fff;
      --border-color: #ccc;
    }
    body {
      font-family: 'Sarabun', 'Tahoma', 'Arial', sans-serif;
      color: var(--text-color);
      background-color: var(--bg-color);
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
      box-sizing: border-box;
    }
    .cover-page {
      text-align: center;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .cover-title {
      font-size: 28pt;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .cover-subtitle {
      font-size: 18pt;
      margin-bottom: 40px;
    }
    .cover-details {
      font-size: 14pt;
      margin-bottom: 60px;
      text-align: left;
      display: inline-block;
    }
    .document-list {
      text-align: left;
      margin: 0 auto;
      display: inline-block;
      font-size: 12pt;
    }
    .document-section {
      page-break-before: always;
      padding-top: 20mm;
    }
    h1, h2, h3, h4 {
      color: #000;
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { font-size: 20pt; border-bottom: 1px solid var(--border-color); padding-bottom: 5px; }
    h2 { font-size: 16pt; }
    h3 { font-size: 14pt; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th, td {
      border: 1px solid var(--border-color);
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f9f9f9;
    }
    pre {
      background-color: #f4f4f4;
      padding: 10px;
      overflow-x: auto;
      page-break-inside: avoid;
    }
    code {
      font-family: monospace;
      background-color: #f4f4f4;
      padding: 2px 4px;
    }
    .approval-section {
      page-break-before: always;
      padding-top: 20mm;
    }
    .signature-box {
      border: 1px solid var(--border-color);
      padding: 40px 20px 20px;
      margin-top: 30px;
      text-align: center;
      width: 300px;
      display: inline-block;
      margin-right: 20px;
    }
    .signature-line {
      border-bottom: 1px solid #000;
      margin: 30px 0 10px;
    }
    @media print {
      body {
        background-color: #fff;
        color: #000;
      }
      .page {
        margin: 0;
        padding: 0;
        width: 100%;
        max-width: none;
      }
      .document-section {
        padding-top: 0;
      }
      * {
        color: #000 !important;
        background: transparent !important;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover-page">
      <div class="cover-title">ชุดเอกสารขออนุมัติ</div>
      <div class="cover-subtitle">โครงการ: ${projectName}</div>
      <div class="cover-details">
        <p><strong>ลูกค้า:</strong> ${clientName}</p>
        <p><strong>วันที่สร้างเอกสาร:</strong> ${dateStr}</p>
      </div>
      <div>
        <strong>เอกสารในชุดประกอบด้วย:</strong>
        <ul class="document-list">
          ${docListHtml}
        </ul>
      </div>
    </div>

    ${bodyHtml}

    <div class="approval-section document-section">
      <h2>ส่วนการลงนามอนุมัติ (Approval Section)</h2>
      <p>ข้าพเจ้าในนามของ <strong>${clientName}</strong> ได้ตรวจสอบและเห็นชอบกับชุดเอกสารที่ระบุไว้ข้างต้นเรียบร้อยแล้ว</p>
      
      <div class="signature-box">
        <div class="signature-line"></div>
        <div>(.......................................................)</div>
        <div style="margin-top: 10px;">ผู้มีอำนาจลงนาม</div>
        <div style="margin-top: 10px;">วันที่: ....../....../......</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Orchestrates the export process:
 * 1. Reads selected files.
 * 2. Strips frontmatter.
 * 3. Generates HTML.
 * 4. Saves to exports folder with safety.
 */
export async function exportApprovalPack(
  projectPath: string,
  projectName: string,
  clientName: string,
  selectedDocs: DocumentInfo[]
): Promise<string> {
  const exportDocs: ExportDocument[] = [];

  for (const doc of selectedDocs) {
    const content = await readFileContent(doc.path);
    exportDocs.push({
      title: doc.filename,
      content: stripFrontmatter(content),
    });
  }

  const htmlOutput = await generateApprovalPackHtml(projectName, clientName, exportDocs);

  // Generate safe file name
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const exportsDir = `${projectPath}/exports`;
  const baseFilename = `approval-pack-${dateStr}`;
  let suffix = '';
  let counter = 1;
  let finalPath = `${exportsDir}/${baseFilename}${suffix}.html`;

  while (await pathExists(finalPath)) {
    suffix = `-${counter}`;
    finalPath = `${exportsDir}/${baseFilename}${suffix}.html`;
    counter++;
  }

  await writeFileContent(finalPath, htmlOutput);

  return finalPath;
}
