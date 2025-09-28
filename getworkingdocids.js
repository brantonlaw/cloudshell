function getWorkingDocumentIDs() {
  // Create three simple documents - content doesn't matter
  var doc1 = DocumentApp.create("L1_PLACEHOLDER");
  var doc2 = DocumentApp.create("L2_PLACEHOLDER");
  var doc3 = DocumentApp.create("L3_PLACEHOLDER");
  
  // Just put minimal content so they're not empty
  doc1.getBody().setText("L1 Template");
  doc2.getBody().setText("L2 Template");
  doc3.getBody().setText("L3 Template");
  
  doc1.saveAndClose();
  doc2.saveAndClose();
  doc3.saveAndClose();
  
  console.log("✅ WORKING DOCUMENT IDs CREATED:");
  console.log("");
  console.log("const TEMPLATES = {");
  console.log("  L1: '" + doc1.getId() + "',");
  console.log("  L2: '" + doc2.getId() + "',");
  console.log("  L3: '" + doc3.getId() + "'");
  console.log("};");
  
  // Test that DocumentApp can open them
  console.log("");
  console.log("Testing access...");
  try {
    DocumentApp.openById(doc1.getId());
    console.log("L1: ✅ Accessible");
  } catch(e) {
    console.log("L1: ❌ " + e.toString());
  }
  
  try {
    DocumentApp.openById(doc2.getId());
    console.log("L2: ✅ Accessible");
  } catch(e) {
    console.log("L2: ❌ " + e.toString());
  }
  
  try {
    DocumentApp.openById(doc3.getId());
    console.log("L3: ✅ Accessible");
  } catch(e) {
    console.log("L3: ❌ " + e.toString());
  }
  
  return {
    L1: doc1.getId(),
    L2: doc2.getId(),
    L3: doc3.getId()
  };
}