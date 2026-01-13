import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { overlaps } from "./dateOverlap";

// --- Vehicles ---

import { FALLBACK_VEHICLES } from "../constants/fallbackVehicles";

// New helper for availability checking
export const fetchAllActiveBookings = async () => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("status", "in", ["PENDING", "APPROVED"])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all active bookings (using persistent fallback):", error);
    // Fallback logic
    const mocks = getMocks();
    return mocks.filter(b => b.status === 'PENDING' || b.status === 'APPROVED');
  }
};

export const fetchVehicles = async () => {
  try {
    const q = query(collection(db, "vehicles"), where("active", "==", true));
    const querySnapshot = await getDocs(q);

    // Fallback if empty
    if (querySnapshot.empty) {
      console.warn("Firestore returned no vehicles. Using fallback data.");
      return FALLBACK_VEHICLES;
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching vehicles (using fallback):", error);
    // Fallback on error (e.g. permission denied, offline)
    return FALLBACK_VEHICLES;
  }
};

export const fetchVehicleById = async (id) => {
  try {
    const docRef = doc(db, "vehicles", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error("Vehicle not found");
    }
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    throw error;
  }
};

// --- In-Memory Mock Data Store (Persistent) ---

const MOCK_STORAGE_KEY = 'mock_bookings_v1';

// Initial Seed Data
const defaultMockBookings = [
  {
    id: 'mock-1',
    vehicleId: 'deepol-s05',
    vehicleName: 'Deepol S05',
    startDate: '2026-06-15',
    endDate: '2026-06-20',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    phoneNumber: '+94 77 123 4567',
    pickupLocation: 'Colombo',
    dropoffLocation: 'Kandy',
    notes: 'Looking for a reliable car.',
    status: 'PENDING',
    totalPrice: 225,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-2',
    vehicleId: 'toyota-axio',
    vehicleName: 'Toyota Axio',
    startDate: '2026-07-01',
    endDate: '2026-07-05',
    customerName: 'Jane Smith',
    customerEmail: 'jane@test.com',
    phoneNumber: '+94 71 987 6543',
    pickupLocation: 'Kandy',
    dropoffLocation: 'Colombo',
    notes: 'Airport transfer needed.',
    status: 'PENDING',
    totalPrice: 180,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mock-3',
    vehicleId: 'toyota-hiace',
    vehicleName: 'Toyota HiAce',
    startDate: '2026-05-10',
    endDate: '2026-05-12',
    customerName: 'Alice Brown',
    customerEmail: 'alice@test.com',
    phoneNumber: '+94 70 111 2222',
    pickupLocation: 'Galle',
    dropoffLocation: 'Matara',
    status: 'APPROVED',
    totalPrice: 120,
    createdAt: new Date().toISOString()
  }
];

// Helper to get mocks
const getMocks = () => {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize if empty
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(defaultMockBookings));
  return defaultMockBookings;
};

// Helper to save mocks
const saveMocks = (newMocks) => {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(newMocks));
};

// --- Bookings ---

/**
 * Fetch bookings for a specific vehicle that are 'PENDING' or 'APPROVED'.
 * Used for conflict checking.
 */
export const fetchBookingsForVehicle = async (vehicleId) => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("vehicleId", "==", vehicleId),
      where("status", "in", ["PENDING", "APPROVED"])
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching vehicle bookings (using persistent fallback):", error);
    // Fallback logic for Demo Mode
    const mocks = getMocks();
    return mocks.filter(b =>
      b.vehicleId === vehicleId &&
      (b.status === 'PENDING' || b.status === 'APPROVED')
    );
  }
};

export const createBooking = async (payload) => {
  try {
    if (!payload?.vehicleId) {
      throw new Error("Missing vehicleId.");
    }
    if (!payload?.startDate || !payload?.endDate) {
      throw new Error("Missing startDate or endDate.");
    }
    if (payload.startDate > payload.endDate) {
      throw new Error("End date must be after start date.");
    }

    // CHECK CONFLICTS (Using the same fetch function which now supports fallback)
    const existingBookings = await fetchBookingsForVehicle(payload.vehicleId);

    // Simple date string comparison is sufficient if format is YYYY-MM-DD
    const conflicts = existingBookings.filter(b =>
      overlaps(payload.startDate, payload.endDate, b.startDate, b.endDate)
    );

    if (conflicts.length > 0) {
      throw new Error(`Selected dates are not available for this vehicle. (Conflict with ${conflicts[0].status.toLowerCase()} booking)`);
    }

    const docRef = await addDoc(collection(db, "bookings"), {
      ...payload,
      status: "PENDING", // Force PENDING
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);

    // If permission error or unavailable, use In-Memory Fallback
    // But re-throw conflict errors to show the alert
    if (error.message.includes("available")) {
      throw error;
    }

    // Otherwise, simulate creation in mock store if it's a permission error
    if (error.code === 'permission-denied' || error.message.includes('permission') || error.message.includes('offline')) {
      // Create mock booking
      const newMock = {
        id: `mock-new-${Date.now()}`,
        ...payload,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const currentMocks = getMocks();
      const updatedMocks = [...currentMocks, newMock];
      saveMocks(updatedMocks);

      // Return fake string ID
      return newMock.id;
    }

    throw error;
  }
};

export const fetchBookingsByStatus = async (status) => {
  try {
    const q = query(
      collection(db, "bookings"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching bookings by status (using persistent fallback):", error);
    // Fallback: Filter persistent array
    const mocks = getMocks();
    console.log(`Fallback fetching ${status} from mocks:`, mocks);
    return mocks.filter(b => b.status === status);
  }
};

export const updateBookingStatus = async (bookingId, status, adminNote = "") => {
  try {
    const docRef = doc(db, "bookings", bookingId);

    const updateData = {
      status,
      adminNote,
      updatedAt: serverTimestamp()
    };

    if (status === "APPROVED") {
      updateData.approvedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating booking status:", error);

    // In-Memory Fallback Update for Demo Mode
    // Check if it's a permission or offline error
    if (error.code === 'permission-denied' || error.message.includes('permission') || error.message.includes('offline')) {
      const currentMocks = getMocks();
      const index = currentMocks.findIndex(b => b.id === bookingId);

      if (index !== -1) {
        currentMocks[index] = {
          ...currentMocks[index],
          status: status,
          adminNote: adminNote,
          updatedAt: new Date().toISOString()
        };

        saveMocks(currentMocks);
        console.log("Updated persistent mock booking:", currentMocks[index]);
        return; // Success
      }
    }
    throw error;
  }
};
