const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeForCleanup() {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
  
  // Get ALL your files, including debug ones
  const files = await fs.readdir(".");
  const codeFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.html'));
  
  // Read more content, especially from suspicious files
  let analysis = "FILES IN PROJECT:\n";
  analysis += codeFiles.join(", ") + "\n\n";
  
  // Get full content from debug/test files
  const suspiciousFiles = files.filter(f => 
    f.includes('debug') || f.includes('test') || f.includes('grok') || f.includes('now.js')
  );
  
  analysis += "SUSPICIOUS FILES CONTENT:\n";
  for (const file of suspiciousFiles.slice(0, 3)) {
    const content = await fs.readFile(file, 'utf-8');
    analysis += `\n=== ${file} (${content.length} bytes) ===\n`;
    analysis += content.slice(0, 1000) + "\n";
  }
  
  const prompt = `You're reviewing a Google Apps Script CRM that's a mess from merging multiple versions. 
  The developer had 3 projects, merged them badly, has debug files everywhere.
  
  ${analysis}
  
  BE SPECIFIC AND HARSH. Tell me:
  1. Which files are obviously debug/test crap that should be deleted
  2. Which files look like duplicates or old versions
  3. What naming inconsistencies reveal about the merge mess
  4. Specific code smells that suggest copy-paste from different versions
  5. A concrete order to clean this up (what to delete first, what to consolidate second, etc.)
  
  Don't give generic advice. Point to specific files and specific problems.`;
  
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}

analyzeForCleanup().catch(console.error);
