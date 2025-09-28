function fixItNow() {
  // Create documents
  var d1 = DocumentApp.create("DELETE_ME_L1");
  var d2 = DocumentApp.create("DELETE_ME_L2");
  var d3 = DocumentApp.create("DELETE_ME_L3");
  
  // Show what to do
  var msg = "Copy this EXACTLY into Constants.gs:\n\n";
  msg += "'L1': '" + d1.getId() + "',\n";
  msg += "'L2': '" + d2.getId() + "',\n";
  msg += "'L3': '" + d3.getId() + "'";
  
  return msg;
}