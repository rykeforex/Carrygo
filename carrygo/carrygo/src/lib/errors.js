const MESSAGES = {
  not_authenticated: "Please sign in again.",
  wrong_role_or_suspended: "This account can't book pickups.",
  invalid_address: "Enter a full pickup address (at least 5 characters).",
  invalid_coordinates: "We couldn't read that location. Set the pin on the map or use your current location.",
  invalid_time: "Choose a collection time within the next 30 days.",
  invalid_category: "That waste category isn't available.",
  invalid_quantity: "That quantity isn't allowed for this category.",
  pricing_unavailable: "Pricing isn't available for this category right now.",
  price_changed: "The price changed. Please review it and confirm again.",
  too_many_open_pickups: "You already have 5 open pickups. Wait for one to finish or cancel one first.",
  cannot_cancel: "This pickup can no longer be cancelled online because your collector is already on the way. Please contact support.",
  not_found: "We couldn't find that pickup.",
  not_eligible: "You can only rate your own completed pickups.",
  invalid_rating: "Choose a rating from 1 to 5.",
  too_many_open_complaints: "You already have several open reports. We'll work through those before you add more.",
  // collector
  not_approved_collector: "Your collector account isn't approved yet.",
  collector_offline: "Go online to see and accept jobs.",
  job_unavailable: "Another collector just took that job, or the customer cancelled it.",
  already_has_active_job: "Finish your current job before accepting another.",
  cannot_accept_own_pickup: "You can't accept your own pickup.",
  cannot_release: "This job can no longer be released.",
  not_your_pickup: "That job isn't assigned to you.",
  invalid_transition: "That step isn't available right now. The job may have changed — refreshing.",
  not_sharing_allowed: "Location sharing isn't allowed for this job right now.",
  invalid_location_data: "That location reading looked invalid and was ignored.",
  active_job_in_progress: "Finish your active job before going offline.",
  // onboarding / admin
  invalid_document_type: "Choose a valid document type.",
  document_not_uploaded: "Your document didn't finish uploading. Please try again.",
  invalid_document_path: "That file couldn't be attached. Please try uploading it again.",
  application_locked: "Your application can't be changed right now.",
  no_application: "No collector application was found for this account.",
  cannot_review_self: "You can't review your own application.",
  forbidden: "You don't have permission to do that.",
};

export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  const raw = `${err?.message || ""} ${err?.details || ""}`;
  for (const [code, msg] of Object.entries(MESSAGES)) if (raw.includes(code)) return msg;
  if (/failed to fetch|networkerror|network request failed/i.test(raw)) return "Network problem — check your connection and try again.";
  if (/duplicate key/i.test(raw) && /reviews/i.test(raw)) return "You've already rated this pickup.";
  if (/phone/i.test(raw) && /check constraint/i.test(raw)) return "Enter a valid phone number.";
  if (/exceeded the maximum allowed size|payload too large/i.test(raw)) return "The file must be 5 MB or smaller.";
  if (/mime type|not supported/i.test(raw)) return "Upload a PDF, JPG or PNG file.";
  if (/jwt|not authorized|permission denied|row-level security/i.test(raw)) return "Your session has expired or you don't have access — please sign in again.";
  return fallback;
}
