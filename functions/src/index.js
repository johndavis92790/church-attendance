/**
 * Church Attendance Firebase Cloud Functions
 */

// Import required packages
const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

// To use Google Sheets API, you'll need to set up a service account and download the JSON key
// For development, we'll continue using mock data but provide the code structure for Google Sheets integration

/**
 * Helper function to initialize Google Sheets API
 * Uses the service account key file to authenticate with Google Sheets
 */
async function getGoogleSheetsClient() {
  try {
    // Path to service account key file
    const keyPath = path.resolve(__dirname, "../service-account-key.json");

    // Check if the key file exists
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
 * Helper function to get names from a Google Sheet
 * Fetches data from the Google Sheet specified in environment variables
 */
async function getNamesFromSheet() {
  try {
    // Initialize sheets client
    const sheets = await getGoogleSheetsClient();

    // Get Google Sheet ID and range from environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.NAMES_SHEET_RANGE || "Names!A2:A"; // Default to Names!A2:A if not specified

    // If we have a valid sheets client and sheet ID, fetch real data
    if (sheets && sheetId) {
      console.log(
        `Fetching names from Google Sheet ${sheetId}, range ${range}`,
      );

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: range,
      });

      if (response.data.values && response.data.values.length > 0) {
        return response.data.values.map((row) => row[0]); // Assuming names are in first column
      } else {
        console.warn("No data found in the specified range");
        return [];
      }
    } else {
      // Return mock data for development
      console.log("Using mock data for names");
      return [
        "Ainsa, Benjamin David",
        "Ainsa, Jeff",
        "Ainsa, Kristin",
        "Andersen, David",
        "Anderson, Sundar",
        "Armstrong, Ellie",
        "Davis, John",
        "Smith, Jane",
        "Johnson, Robert",
        "Williams, Emily",
        "Garcia, Maria",
      ];
    }
  } catch (error) {
    console.error("Error getting names from sheet:", error);
    throw error;
  }
}

/**
 * Cloud Function that returns the list of attendance names
 */
exports.getAttendanceNames = functions.https.onRequest((req, res) => {
  // Wrap the function in cors middleware
  return cors(req, res, async () => {
    try {
      console.log("Getting attendance names");

      // Configuration for Google Sheets
      // In production, these would come from environment variables
      const sheetId = "your-google-sheet-id"; // You'll replace this with your actual Sheet ID
      const range = "Sheet1!A2:A"; // Assumes names start from A2 and continue down column A

      // Get names from the sheet (or mock data for now)
      const names = await getNamesFromSheet(sheetId, range);

      // Send the response
      res.status(200).send({ names });
    } catch (error) {
      console.error("Error in getAttendanceNames:", error);
      res.status(500).send({ error: "Failed to get attendance names" });
    }
  });
});

/**
 * Cloud Function to save attendance data
 */
/**
 * Helper function to save attendance data to Google Sheets
 */
async function saveAttendanceToSheet(date, attendanceData) {
  try {
    // Initialize sheets client
    const sheets = await getGoogleSheetsClient();

    // Get Google Sheet ID and range from environment variables
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = process.env.ATTENDANCE_SHEET_RANGE || "Attendance";

    if (!sheets || !sheetId) {
      console.log(
        "No valid Google Sheets client or Sheet ID, can't save attendance",
      );
      return false;
    }

    // Format data for the sheet - first column is date, following columns are names with TRUE/FALSE values
    // First, we need to get the current data to find the next empty row
    const currentData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
    });

    // Prepare the new row: [date, name1: true/false, name2: true/false, ...]
    const names = Object.keys(attendanceData);

    // If this is a new sheet, we'll add a header row first
    let rowIndex = 1;
    if (!currentData.data.values || currentData.data.values.length === 0) {
      // Create header row with "Date" and all names
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: range,
        valueInputOption: "RAW",
        resource: {
          values: [["Date", ...names]],
        },
      });
    } else {
      rowIndex = currentData.data.values.length + 1;
    }

    // Create values array with date and attendance data
    const values = [date];
    names.forEach((name) => {
      values.push(attendanceData[name] ? "TRUE" : "FALSE");
    });

    // Append the data
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: "RAW",
      resource: {
        values: [values],
      },
    });

    console.log(
      `Attendance data for ${date} saved to Google Sheet row ${rowIndex}`,
    );
    return true;
  } catch (error) {
    console.error("Error saving attendance to sheet:", error);
    return false;
  }
}

/**
 * Cloud Function to save attendance data
 */
exports.saveAttendance = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      // Log the incoming request
      console.log("Saving attendance data", request.body);

      // Basic validation
      if (!request.body || !request.body.date || !request.body.attendance) {
        response.status(400).send({
          error: "Invalid request data. Required fields: date, attendance",
        });
        return;
      }

      const { date, attendance } = request.body;

      // Try to save to Google Sheets
      const saved = await saveAttendanceToSheet(date, attendance);

      if (saved) {
        response.status(200).send({
          message: "Attendance data successfully saved to Google Sheets",
          receivedData: request.body,
        });
      } else {
        // Fall back to just acknowledging receipt without saving
        response.status(200).send({
          message:
            "Attendance data received (not saved to Google Sheets - using fallback)",
          receivedData: request.body,
        });
      }
    } catch (error) {
      console.error("Error saving attendance data:", error);
      response.status(500).send({
        error: "Failed to save attendance data",
        details: error.message,
      });
    }
  });
});
