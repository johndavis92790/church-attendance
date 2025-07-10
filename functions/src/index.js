/**
 * Church Attendance Firebase Cloud Functions
 */

// Import Firebase Functions SDK
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

/**
 * Cloud Function that returns the list of attendance names
 */
exports.getAttendanceNames = functions.https.onRequest((req, res) => {
  // Wrap the function in cors middleware
  return cors(req, res, () => {
    console.log("Getting attendance names");
    
    // For testing purposes, return mock data
    const names = [
      "Ainsa, Benjamin David",
      "Ainsa, Jeff",
      "Ainsa, Kristin",
      "Andersen, David",
      "Anderson, Sundar",
      "Armstrong, Ellie"
    ];
    
    // Send the response
    res.status(200).send({ names });
  });
});
