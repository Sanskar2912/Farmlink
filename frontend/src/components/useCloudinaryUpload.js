import { useAuth } from "./AuthContext";

/**
 * useCloudinaryUpload
 *
 * Provides helper functions that:
 * 1. Convert file → base64 in the browser
 * 2. Send to our backend API
 * 3. Backend uploads to Cloudinary
 * 4. Returns the Cloudinary URL back to the component
 *
 * Components NEVER talk to Cloudinary directly.
 * They just call these helpers and get back URLs.
 */
export function useCloudinaryUpload() {
  const { authFetch } = useAuth();

  // Convert a File object to base64 string
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result); // includes "data:image/jpeg;base64,..."
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  // Validate file before converting
  const validateFile = (file, maxMB = 2) => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file (JPG or PNG).");
    }
    if (file.size > maxMB * 1024 * 1024) {
      throw new Error(`Image must be smaller than ${maxMB}MB. Please compress the photo.`);
    }
  };

  /**
   * Upload a single equipment listing photo
   * @param {File} file
   * @returns {Promise<string>} Cloudinary URL
   */
  const uploadEquipmentPhoto = async (file) => {
    validateFile(file, 2);
    const base64 = await fileToBase64(file);
    const res    = await authFetch("/api/upload/equipment", {
      method: "POST",
      body:   JSON.stringify({ image: base64 }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed.");
    return data.url; // Cloudinary URL
  };

  /**
   * Upload dispatch condition photos (up to 4)
   * @param {File[]} files
   * @param {string} bookingId
   * @returns {Promise<string[]>} Array of Cloudinary URLs
   */
  const uploadDispatchPhotos = async (files, bookingId) => {
    if (files.length > 4) throw new Error("Maximum 4 photos allowed.");
    files.forEach(f => validateFile(f, 3));
    const base64s = await Promise.all(files.map(fileToBase64));
    const res     = await authFetch("/api/upload/dispatch", {
      method: "POST",
      body:   JSON.stringify({ images: base64s, bookingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed.");
    return data.urls; // Array of Cloudinary URLs
  };

  /**
   * Upload return condition photos (up to 4)
   * @param {File[]} files
   * @param {string} bookingId
   * @returns {Promise<string[]>} Array of Cloudinary URLs
   */
  const uploadReturnPhotos = async (files, bookingId) => {
    if (files.length > 4) throw new Error("Maximum 4 photos allowed.");
    files.forEach(f => validateFile(f, 3));
    const base64s = await Promise.all(files.map(fileToBase64));
    const res     = await authFetch("/api/upload/return", {
      method: "POST",
      body:   JSON.stringify({ images: base64s, bookingId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed.");
    return data.urls;
  };

  return { uploadEquipmentPhoto, uploadDispatchPhotos, uploadReturnPhotos };
}
