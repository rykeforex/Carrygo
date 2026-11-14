export const DOC_MAX_BYTES = 5 * 1024 * 1024;
export const DOC_EXT = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" };
export const DOC_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "drivers_license", label: "Driver's licence" },
  { value: "passport", label: "Passport" },
];

// Returns an error message, or null if the file is acceptable. (The bucket and database enforce the same rules.)
export function validateDocument(file) {
  if (!file) return "Choose a file to upload.";
  if (!DOC_EXT[file.type]) return "Upload a PDF, JPG or PNG file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > DOC_MAX_BYTES) return "The file must be 5 MB or smaller.";
  return null;
}
