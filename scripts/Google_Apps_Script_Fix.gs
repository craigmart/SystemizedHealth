// Google Apps Script Web App Endpoint for Systemized Health Master Pipeline
// Replace the entire code in your Apps Script Editor (Extensions > Apps Script) with this file.

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Find the Pipeline sheet tab or default to active sheet
    var sheet = ss.getSheetByName("Master Video Production Pipeline") || 
                ss.getSheetByName("Pipeline") || 
                ss.getActiveSheet();
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    if (lastRow < 1 || lastCol < 1) {
      return responseJSON({ status: "error", message: "Sheet is empty" });
    }
    
    // Find header row (check row 1 or 2)
    var headerRowIdx = 1;
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // If row 1 is a title banner, check row 2
    var hasCodeHeader = headers.some(function(h) { return h.toString().toLowerCase().indexOf("code") !== -1; });
    if (!hasCodeHeader && lastRow >= 2) {
      headers = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
      headerRowIdx = 2;
    }
    
    // Map header names (normalized lowercase) to 1-based column index
    var colMap = {};
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i].toString().trim().toLowerCase();
      colMap[h] = i + 1;
    }
    
    var codeCol = colMap["code"] || 1;
    var titleCol = colMap["title"] || 6;
    
    // Search for existing row matching 'code' or 'title'
    var targetRow = -1;
    var startRow = headerRowIdx + 1;
    if (lastRow >= startRow) {
      var searchRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, lastCol).getValues();
      for (var r = 0; r < searchRange.length; r++) {
        var rowCode = searchRange[r][codeCol - 1] ? searchRange[r][codeCol - 1].toString().trim() : "";
        var rowTitle = searchRange[r][titleCol - 1] ? searchRange[r][titleCol - 1].toString().trim() : "";
        
        if (data.code && rowCode && rowCode.toLowerCase() === data.code.toString().trim().toLowerCase()) {
          targetRow = startRow + r;
          break;
        }
        if (data.title && rowTitle && rowTitle.toLowerCase() === data.title.toString().trim().toLowerCase()) {
          targetRow = startRow + r;
          break;
        }
      }
    }
    
    // If not found, target the next row
    var actionTaken = "updated";
    if (targetRow === -1) {
      targetRow = lastRow + 1;
      actionTaken = "created";
    }
    
    // Helper to set cell value safely by matching header name
    function setCell(possibleNames, value) {
      if (value === undefined || value === null || value === "") return;
      if (typeof possibleNames === "string") possibleNames = [possibleNames];
      
      for (var k = 0; k < possibleNames.length; k++) {
        var pName = possibleNames[k].toLowerCase();
        var colIdx = colMap[pName];
        if (colIdx) {
          sheet.getRange(targetRow, colIdx).setValue(value);
          return;
        }
      }
    }
    
    // Write values into corresponding table columns
    setCell(["code"], data.code);
    setCell(["title"], data.title);
    setCell(["format"], data.format);
    setCell(["drop date", "dropdate"], data.drop_date);
    setCell(["uploaded", "upload date"], data.uploaded);
    setCell(["asset url", "asseturl", "link", "url"], data.asset_url || data.link);
    setCell(["task open", "taskopen", "open"], data.task_open);
    setCell(["notes"], data.notes);
    setCell(["platform"], data.platform);
    
    return responseJSON({
      status: "success",
      action: actionTaken,
      row: targetRow,
      sheetName: sheet.getName(),
      message: actionTaken + " row " + targetRow + " in tab '" + sheet.getName() + "'"
    });
    
  } catch (err) {
    return responseJSON({ status: "error", message: err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
