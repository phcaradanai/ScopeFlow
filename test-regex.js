const content = `## 1. คำขอลูกค้าต้นฉบับ (Raw Request)

> Test request
> Line 2

## 2. สิ่งที่เข้าใจจากคำขอ (Understanding)
`;

const rawMatch = content.match(/## 1\. คำขอลูกค้าต้นฉบับ \(Raw Request\)\n+> ([\s\S]*?)(\n## 2|\n*$)/);
console.log(rawMatch ? rawMatch[1] : "null");
