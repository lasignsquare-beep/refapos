/**
 * Refabit Salesheet - Google Apps Script
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this entire file.
 * 4. Click Save, then Deploy > New Deployment.
 * 5. Type: "Web app"
 * 6. Description: "Salesheet Integration"
 * 7. Execute as: "Me"
 * 8. Who has access: "Anyone"
 * 9. Click Deploy and copy the Web App URL.
 * 10. Paste the URL into your .env.local file as NEXT_PUBLIC_GOOGLE_SCRIPT_URL
 *
 * NOTE: After updating this script, you must create a NEW DEPLOYMENT
 * (not just save) for changes to take effect on the live web app URL.
 */

var SHEET_NAME = 'Sales'; // Change this if your sheet tab has a different name

/**
 * POST: Receive a new sale and append it to the sheet.
 */
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Add header row if the sheet is empty
    if (sheet.getLastRow() === 0) {
      addHeaders(sheet);
    }

    var data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.id,
      data.date,
      data.account,
      data.client,
      data.productDescription,
      data.unitPrice,
      data.quantity,
      data.totalPrice,
      data.paymentMode,
      data.remarks || '',
      new Date().toLocaleString(),
    ]);

    sheet.autoResizeColumns(1, 11);

    return jsonResponse({ success: true, message: 'Sale recorded successfully.' });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

/**
 * GET: Return all sales rows as JSON so the web app can load data
 * from Google Sheets on startup (enables cross-browser data sharing).
 */
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() <= 1) {
      return jsonResponse({ success: true, sales: [] });
    }

    // Rows start at 2 (row 1 is headers)
    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();

    var sales = data
      .filter(function (row) {
        return row[0] !== ''; // skip blank rows
      })
      .map(function (row) {
        return {
          id: String(row[0]),
          date: row[1],
          account: row[2],
          client: row[3],
          productDescription: row[4],
          unitPrice: Number(row[5]),
          quantity: Number(row[6]),
          totalPrice: Number(row[7]),
          paymentMode: row[8],
          remarks: row[9] || '',
        };
      });

    return jsonResponse({ success: true, sales: sales });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString(), sales: [] });
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function addHeaders(sheet) {
  sheet.appendRow([
    'ID',
    'Date',
    'Account',
    'Client',
    'Product Description',
    'Unit Price (KES)',
    'Quantity',
    'Total Price (KES)',
    'Payment Mode',
    'Remarks',
    'Submitted At',
  ]);
  var headerRange = sheet.getRange(1, 1, 1, 11);
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
