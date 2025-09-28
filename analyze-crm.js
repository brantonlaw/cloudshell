const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeCRMProject() {
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });
  
  // Files are in current directory!
  const projectPath = ".";  // <-- FIXED: current directory
  
  try {
    const files = await fs.readdir(projectPath);
    const codeFiles = files.filter(f => 
      f.endsWith('.js') || f.endsWith('.html')
    );
    
    console.log(`Found ${codeFiles.length} code files to analyze...`);
    
    let codeContext = "Apps Script CRM Project Structure:\n";
    // Key files to analyze
    const keyFiles = ['code.js', 'SheetManager.js', 'StatusEngine.js', 'mailmerge.js', 'FolderManager.js'];
    
    for (const file of keyFiles) {
      if (files.includes(file)) {
        const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
        codeContext += `\n=== ${file} ===\n${content.slice(0, 500)}...\n`;
      }
    }
    
    const prompt = `Analyze this Google Apps Script CRM project:
    ${codeContext}
    
    Provide:
    1. Architecture assessment
    2. Top 3 refactoring priorities  
    3. Security considerations for client access
    4. Performance optimization opportunities`;
    
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

analyzeCRMProject();
