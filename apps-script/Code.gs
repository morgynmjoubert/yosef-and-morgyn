/**
 * Yosef & Morgyn RSVP collector.
 * Paste into the Google Sheet's Extensions > Apps Script editor, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Each RSVP from the website becomes one row on the "RSVPs" tab.
 */
const SHEET_NAME = 'RSVPs';
const HEADERS = ['Submitted', 'Name', 'Attending', 'Party size', 'Plus-one', 'Dietary needs or allergies'];
const TOTAL_FORMULA = '=SUM(D2:D)+COUNTA(E2:E)';
const MAX_PARTY = 6;

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Hidden field that only bots fill in: accept quietly, store nothing.
  if (p.website) return json_({ ok: true });

  const name = clean_(p.name, 100);
  if (!name) return json_({ ok: false, error: 'Please enter your full name.' });

  const attending = p.attending === 'yes' ? 'Yes' : p.attending === 'no' ? 'No' : '';
  if (!attending) return json_({ ok: false, error: "Please let us know if you'll be there." });

  let party = 0;
  if (attending === 'Yes') {
    party = parseInt(p.party, 10);
    if (!(party >= 1 && party <= MAX_PARTY)) party = 1;
  }
  const plusOne = attending === 'Yes' && p.plusone === 'yes' ? clean_(p.plusone_name, 100) : '';
  if (attending === 'Yes' && p.plusone === 'yes' && !plusOne) {
    return json_({ ok: false, error: "Please add your plus-one's full name." });
  }
  const dietary = attending === 'Yes' ? clean_(p.dietary, 500) : '';

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow([new Date(), name, attending, party, plusOne, dietary]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// Lets you open the web app URL in a browser to confirm it's live.
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running.' });
}

// Run once from the editor (select "setup" > Run) to create the tab and headcount.
function setup() {
  sheet_();
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.getRange('H1').setValue('Total attending').setFontWeight('bold');
    sh.getRange('I1').setFormula(TOTAL_FORMULA);
    sh.getRange('H2').setValue('Seated limit (Bodega Room)').setFontWeight('bold');
    sh.getRange('I2').setValue(44);
  }
  return sh;
}

// One-time upgrade for a sheet made before plus-ones: adds the Plus-one
// column after Party size and counts plus-ones in the total. Safe to re-run.
function upgradeForPlusOnes() {
  const sh = sheet_();
  if (sh.getRange('E1').getValue() === 'Plus-one') return;
  sh.insertColumnAfter(4);
  sh.getRange('E1').setValue('Plus-one').setFontWeight('bold');
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const col = headers.indexOf('Total attending');
  if (col >= 0) sh.getRange(1, col + 2).setFormula(TOTAL_FORMULA);
}

// Trims, caps length, and stops spreadsheet formula injection.
function clean_(value, max) {
  let s = String(value || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
