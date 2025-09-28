function debugMailMergePermissions() {
  console.log("=== PERMISSION DEBUG ===");
  
  // 1. Who am I?
  console.log("Running as:", Session.getActiveUser().getEmail());
  console.log("Effective user:", Session.getEffectiveUser().getEmail());
  
  // 2. Can I access the templates?
  var templates = {
    L1: '16YQhSaABESJQ_dqkz_-RgQuijPP8hRio',
    L2: '1YPetHlxI8b-5ZxZh5-BuyI5yb43TFME6',
    L3: '1TuviTeIOn5CsuOD9f5rl0dFpEyBbgzAU'
  };
  
  Object.keys(templates).forEach(function(key) {
    try {
      var file = DriveApp.getFileById(templates[key]);
      console.log(key + " - Drive access: YES");
      console.log("  Owner: " + file.getOwner().getEmail());
      console.log("  Can edit: " + file.isEditable());
      
      try {
        var doc = DocumentApp.openById(templates[key]);
        console.log("  Document access: YES - " + doc.getName());
      } catch(docError) {
        console.log("  Document access: NO - " + docError.toString());
      }
    } catch(driveError) {
      console.log(key + " - Drive access: NO - " + driveError.toString());
    }
  });
  
  // 3. Can I create new documents?
  try {
    var test = DocumentApp.create("PERMISSION_TEST_" + new Date().getTime());
    console.log("Can create documents: YES - " + test.getId());
    DriveApp.getFileById(test.getId()).setTrashed(true);
  } catch(e) {
    console.log("Can create documents: NO - " + e.toString());
  }
}