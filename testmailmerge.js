function testMailMerge() {
  console.log("Testing mail merge setup...");
  
  // Check templates are accessible
  try {
    var l1 = DocumentApp.openById(TEMPLATES.L1);
    console.log("L1 Template: " + l1.getName());
  } catch(e) {
    console.log("L1 FAILED: " + e.toString());
  }
  
  try {
    var l2 = DocumentApp.openById(TEMPLATES.L2);
    console.log("L2 Template: " + l2.getName());
  } catch(e) {
    console.log("L2 FAILED: " + e.toString());
  }
  
  try {
    var l3 = DocumentApp.openById(TEMPLATES.L3);
    console.log("L3 Template: " + l3.getName());
  } catch(e) {
    console.log("L3 FAILED: " + e.toString());
  }
  
  // Test getting a case
  var cases = SheetManager.getCases();
  if (cases && cases.length > 0) {
    console.log("Found " + cases.length + " cases");
    console.log("First case: " + cases[0].businessName);
  }
  
  console.log("Ready to test mail merge!");
}