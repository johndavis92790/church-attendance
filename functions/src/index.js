const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const ATTENDANCE_SHEET_NAME = "Attendance";
const ATTENDANCE_SHEET_FIRST_CELL = "A1";
const ATTENDANCE_SHEET_LAST_CELL = "Z";
const ATTENDANCE_SHEET_RANGE = `${ATTENDANCE_SHEET_NAME}!${ATTENDANCE_SHEET_FIRST_CELL}:${ATTENDANCE_SHEET_LAST_CELL}`;

/**
 * Helper function to initialize Google Sheets API
 * Uses the service account key file to authenticate with Google Sheets
 */
async function getGoogleSheetsClient() {
  try {
    const keyPath = path.resolve(__dirname, "../service-account-key.json");

    if (fs.existsSync(keyPath)) {
      const auth = new google.auth.GoogleAuth({
        keyFile: keyPath,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const authClient = await auth.getClient();
      return google.sheets({ version: "v4", auth: authClient });
    } else {
      console.warn("Service account key file not found, using mock data");
      return null;
    }
  } catch (error) {
    console.error("Error initializing Google Sheets client:", error);
    return null;
  }
}

/**
 * Helper function to get all attendance data from the Google Sheet
 * Fetches data including dates and attendance values
 */
async function getAttendanceDataFromSheet() {
  try {
    const sheets = await getGoogleSheetsClient();

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = ATTENDANCE_SHEET_RANGE;

    console.log(
      `Fetching attendance data from Google Sheet ${sheetId}, range ${range}`,
    );

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    if (response.data.values && response.data.values.length > 0) {
      const headerRow = response.data.values[0];
      const dates = headerRow.slice(1); // All columns after the first one (Name) are dates

      // Extract names and attendance data
      const attendanceData = response.data.values.slice(1).map((row) => {
        const name = row[0];
        const attendance = {};

        // For each date column, map the attendance value
        dates.forEach((date, index) => {
          const value = row[index + 1];
          // Convert any "TRUE", "true", true to boolean true, everything else is false
          attendance[date] =
            value === "TRUE" || value === "true" || value === true;
        });

        return { name, attendance };
      });

      return {
        dates,
        attendanceData,
      };
    } else {
      console.warn("No data found in the specified range");
      return {
        dates: [],
        attendanceData: [],
      };
    }
  } catch (error) {
    console.error("Error getting attendance data from sheet:", error);
    throw error;
  }
}

/**
 * Cloud Function that returns attendance data including dates and name records
 */
exports.getAttendanceData = functions.https.onRequest((req, res) => {
  // Wrap the function in cors middleware
  return cors(req, res, async () => {
    try {
      const data = await getAttendanceDataFromSheet();

      res.status(200).send({
        dates: data.dates,
        attendanceData: data.attendanceData,
      });
    } catch (error) {
      console.error("Error in getAttendanceData:", error);
      res.status(500).send({ error: "Failed to get attendance data" });
    }
  });
});

/**
 * Helper function to update attendance data for a specific date in Google Sheets
 * Uses batch update to update all values in a single API call
 */
async function updateAttendanceInSheet(date, attendanceData) {
  const sheets = await getGoogleSheetsClient();

  if (!sheets) {
    console.error("Could not initialize Google Sheets client");
    return false;
  }

  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.error("Missing sheet ID");
    return false;
  }

  try {
    const range = ATTENDANCE_SHEET_RANGE;

    // First, get the current sheet data
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    if (!currentData.data.values || currentData.data.values.length === 0) {
      console.error("No data found in sheet to update");
      return false;
    }

    // Find the column index for the requested date
    const headerRow = currentData.data.values[0];
    const dateColumnIndex = headerRow.findIndex((header) => header === date);

    if (dateColumnIndex === -1) {
      console.error(`Date '${date}' not found in spreadsheet headers`);
      return false;
    }

    // Prepare batch update with all attendance values at once
    const batchUpdateData = [];
    const columnLetter = String.fromCharCode(65 + dateColumnIndex); // A, B, C, etc.

    // Track which names were successfully processed
    const updatedNames = [];

    // For each name in the attendance data, find the row and add to batch update
    for (const record of attendanceData) {
      const name = record.name;
      const isPresent = record.present;

      // Find the row with this name
      const rowIndex = currentData.data.values.findIndex(
        (row) => row[0] === name,
      );

      if (rowIndex === -1) {
        console.warn(`Name '${name}' not found in spreadsheet`);
        continue;
      }

      // Add to batch update requests
      // Use boolean true/false instead of strings to maintain checkbox format
      batchUpdateData.push({
        range: `${ATTENDANCE_SHEET_NAME}!${columnLetter}${rowIndex + 1}`,
        values: [[isPresent]],
      });

      updatedNames.push(`${name} (${isPresent ? "present" : "absent"})`);
    }

    // Execute the batch update with all values at once
    if (batchUpdateData.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          valueInputOption: "RAW",
          data: batchUpdateData,
        },
      });

      console.log(
        `Updated ${batchUpdateData.length} attendance records for ${date} in a single batch`,
      );
      return true;
    } else {
      console.warn("No valid attendance records to update");
      return false;
    }
  } catch (error) {
    console.error("Error updating attendance in sheet:", error);
    return false;
  }
}

/**
 * Cloud Function to update attendance data for a specific date
 */
exports.updateAttendance = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Log the incoming request
      console.log("Updating attendance data", request.body);

      // Basic validation
      if (!request.body || !request.body.date || !request.body.attendance) {
        response.status(400).send({
          error: "Invalid request data. Required fields: date, attendance",
        });
        return;
      }

      const { date, attendance } = request.body;

      // Update the Google Sheet
      const updated = await updateAttendanceInSheet(date, attendance);

      if (updated) {
        response.status(200).send({
          message: "Attendance data successfully updated in Google Sheets",
          receivedData: request.body,
        });
      } else {
        response.status(500).send({
          error: "Failed to update attendance data in Google Sheets",
          receivedData: request.body,
        });
      }
    } catch (error) {
      console.error("Error updating attendance data:", error);
      response.status(500).send({
        error: "Failed to update attendance data",
        details: error.message,
      });
    }
  });
});
