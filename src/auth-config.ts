import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import app from "./firebase-config";

// Initialize Firestore
const db = getFirestore(app);

// Collection reference for authorized users
const usersCollection = collection(db, "authorized_users");

// Cache the authorized emails
let cachedAuthorizedEmails: string[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutes cache

/**
 * Fetch the list of authorized emails from Firestore
 */
export const getAuthorizedEmails = async (): Promise<string[]> => {
  const now = Date.now();

  // Return cached emails if not expired
  if (
    cachedAuthorizedEmails.length > 0 &&
    now - lastFetchTime < CACHE_DURATION
  ) {
    return cachedAuthorizedEmails;
  }

  try {
    const authSnapshot = await getDocs(usersCollection);
    cachedAuthorizedEmails = authSnapshot.docs.map((doc) =>
      doc.data().email.toLowerCase(),
    );
    lastFetchTime = now;
    return cachedAuthorizedEmails;
  } catch (error) {
    console.error("Error fetching authorized emails:", error);
    return [];
  }
};

/**
 * Check if a user's email is in the authorized list
 */
export const isUserAuthorized = async (
  email: string | null,
): Promise<boolean> => {
  if (!email) return false;
  const authorizedEmails = await getAuthorizedEmails();
  return authorizedEmails.includes(email.toLowerCase());
};

/**
 * Add a new authorized email to Firestore
 */
export const addAuthorizedEmail = async (
  email: string,
  addedBy: string,
): Promise<boolean> => {
  if (!email) return false;

  try {
    // Check if email already exists
    const q = query(usersCollection, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      console.log("Email already authorized");
      return false;
    }

    // Add the new email
    await addDoc(usersCollection, {
      email: email.toLowerCase(),
      addedBy,
      addedAt: new Date(),
    });

    // Invalidate cache
    cachedAuthorizedEmails = [];
    lastFetchTime = 0;

    return true;
  } catch (error) {
    console.error("Error adding authorized email:", error);
    return false;
  }
};

/**
 * Remove an authorized email from Firestore
 */
export const removeAuthorizedEmail = async (
  email: string,
): Promise<boolean> => {
  try {
    const q = query(usersCollection, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Email not found in authorized list");
      return false;
    }

    // Delete the document
    await deleteDoc(doc(db, "authorized_users", querySnapshot.docs[0].id));

    // Invalidate cache
    cachedAuthorizedEmails = [];
    lastFetchTime = 0;

    return true;
  } catch (error) {
    console.error("Error removing authorized email:", error);
    return false;
  }
};
