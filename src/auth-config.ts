// List of email addresses that are allowed to access the app
// Add the exact Google email addresses of the 5-6 people who should have access
export const AUTHORIZED_EMAILS = [
  "john.davis.92790@gmail.com",
  // Add additional emails as needed
];

// Function to check if a user's email is in the authorized list
export const isUserAuthorized = (email: string | null): boolean => {
  if (!email) return false;
  return AUTHORIZED_EMAILS.includes(email.toLowerCase());
};
