import { supabase } from "./supabase";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const LIST_COLS =
  "id, reference, status, quantity, address_text, estimated_price, final_price, currency, preferred_time, created_at, completed_at, payment_status, price_was_approved, waste_categories(label, unit)";
const DETAIL_COLS = `${LIST_COLS}, lat, lng, cancel_reason, assigned_at, collected_at, cancelled_at, collector:collector_profiles(vehicle_type, rating_avg, rating_count, completed_jobs, profile:profiles(full_name, phone))`;

export const listCategories = async () =>
  unwrap(await supabase.from("waste_categories").select("code, label, unit, max_quantity, sort_order").eq("is_active", true).order("sort_order"));

export async function quotePickup(category, quantity) {
  const rows = unwrap(await supabase.rpc("quote_pickup", { p_category: category, p_quantity: quantity }));
  return rows?.[0] ?? null;
}

export const createPickup = async ({ category, quantity, address, lat, lng, preferredTime, idempotencyKey, expectedPrice }) =>
  unwrap(await supabase.rpc("create_pickup", {
    p_category: category, p_quantity: quantity, p_address: address, p_lat: lat, p_lng: lng,
    p_preferred_time: preferredTime ?? null, p_idempotency_key: idempotencyKey ?? null, p_expected_price: expectedPrice ?? null,
  }));

export const listMyPickups = async () =>
  unwrap(await supabase.from("pickups").select(LIST_COLS).order("created_at", { ascending: false }).limit(100));

export const getPickup = async (id) => unwrap(await supabase.from("pickups").select(DETAIL_COLS).eq("id", id).maybeSingle());

export const getPickupEvents = async (id) =>
  unwrap(await supabase.from("pickup_events").select("to_status, created_at").eq("pickup_id", id).order("created_at", { ascending: true }));

export const cancelPickup = async (id, reason) =>
  unwrap(await supabase.rpc("cancel_pickup", { p_id: id, p_reason: reason || null }));

export const getMyReview = async (pickupId) =>
  unwrap(await supabase.from("reviews").select("rating, comment, created_at").eq("pickup_id", pickupId).maybeSingle());

export const submitReview = async (pickupId, rating, comment) =>
  unwrap(await supabase.rpc("submit_review", { p_pickup: pickupId, p_rating: rating, p_comment: comment || null }));

export const submitComplaint = async ({ subject, body, pickupId }) =>
  unwrap(await supabase.rpc("submit_complaint", { p_subject: subject, p_body: body, p_pickup: pickupId || null }));

export const listMyComplaints = async () =>
  unwrap(await supabase.from("complaints").select("id, subject, body, status, resolution_note, pickup_id, created_at").order("created_at", { ascending: false }).limit(50));

export const listNotifications = async () =>
  unwrap(await supabase.from("notifications").select("id, type, title, body, pickup_id, read_at, created_at").order("created_at", { ascending: false }).limit(30));

export const markAllNotificationsRead = async () =>
  unwrap(await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null));

export async function updateMyProfile(id, { full_name, phone }) {
  const data = unwrap(await supabase.from("profiles").update({ full_name, phone }).eq("id", id).select("id").maybeSingle());
  if (!data) throw new Error("Your profile could not be saved.");
  return data;
}

function channelFor(name, config, cb) {
  const ch = supabase.channel(`${name}-${Math.random().toString(36).slice(2, 8)}`).on("postgres_changes", config, cb).subscribe();
  return () => { supabase.removeChannel(ch); };
}
export const subscribeToPickup = (id, cb) => channelFor("pickup", { event: "*", schema: "public", table: "pickups", filter: `id=eq.${id}` }, cb);
export const subscribeToMyPickups = (uid, cb) => channelFor("my-pickups", { event: "*", schema: "public", table: "pickups", filter: `customer_id=eq.${uid}` }, cb);
export const subscribeToNotifications = (uid, cb) => channelFor("notifs", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, cb);

// ================= collector =================
import { newKey } from "./ids";
import { DOC_EXT, validateDocument } from "./documents";

export const getMyCollector = async (uid) =>
  unwrap(await supabase.from("collector_profiles").select("status, is_online, vehicle_type, rating_avg, rating_count, completed_jobs").eq("user_id", uid).maybeSingle());
export const setCollectorOnline = async (online) => unwrap(await supabase.rpc("set_collector_online", { p_online: online }));
export const listOpenPickups = async (lat, lng, radiusKm = 15) =>
  unwrap(await supabase.rpc("list_open_pickups", { p_lat: lat, p_lng: lng, p_radius_km: radiusKm }));
export const acceptPickup = async (id) => unwrap(await supabase.rpc("accept_pickup", { p_id: id }));
export const releasePickup = async (id) => unwrap(await supabase.rpc("release_pickup", { p_id: id }));
export const advancePickup = async (id, to) => unwrap(await supabase.rpc("advance_pickup", { p_id: id, p_to: to }));

const JOB_COLS =
  "id, reference, status, quantity, address_text, lat, lng, estimated_price, final_price, currency, preferred_time, created_at, assigned_at, waste_categories(label, unit), customer:profiles(full_name, phone)";
export const getActiveJob = async (uid) =>
  unwrap(await supabase.from("pickups").select(JOB_COLS).eq("collector_id", uid).in("status", ["assigned", "en_route", "arrived", "collected"]).maybeSingle());

// History deliberately omits customer addresses and names.
export const listCompletedJobs = async (uid) =>
  unwrap(await supabase.from("pickups").select("id, reference, final_price, currency, completed_at, quantity, waste_categories(label, unit)").eq("collector_id", uid).eq("status", "completed").order("completed_at", { ascending: false }).limit(50));
export const getMyStats = async () => (unwrap(await supabase.rpc("my_collector_stats")) || [])[0] ?? null;
export const listMyReviews = async () =>
  unwrap(await supabase.from("reviews").select("rating, comment, created_at").order("created_at", { ascending: false }).limit(30));
export const subscribeToMyJobs = (uid, cb) =>
  channelFor("my-jobs", { event: "*", schema: "public", table: "pickups", filter: `collector_id=eq.${uid}` }, cb);

export async function uploadCollectorDocument(uid, file, docType) {
  const problem = validateDocument(file);
  if (problem) throw new Error(problem);
  const path = `${uid}/${newKey()}.${DOC_EXT[file.type]}`; // generated name: never trust the user's filename
  const up = await supabase.storage.from("collector-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw up.error;
  unwrap(await supabase.rpc("attach_collector_document", { p_path: path, p_doc_type: docType }));
  return path;
}

// ================= admin =================
export const adminListCollectors = async (status) => unwrap(await supabase.rpc("admin_list_collectors", { p_status: status || null }));
export const adminReviewCollector = async (userId, decision, notes) =>
  unwrap(await supabase.rpc("admin_review_collector", { p_user: userId, p_decision: decision, p_notes: notes || null }));
export async function adminDocumentUrl(path) {
  const { data, error } = await supabase.storage.from("collector-documents").createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

// ================= live tracking (Phase 4) =================
export const updateLocation = async (jobId, lat, lng, heading, accuracy) =>
  unwrap(await supabase.rpc("update_location", { p_pickup: jobId, p_lat: lat, p_lng: lng, p_heading: heading ?? null, p_accuracy: accuracy ?? null }));
export const getCollectorLocation = async (pickupId) =>
  unwrap(await supabase.from("collector_locations").select("lat, lng, heading, accuracy_m, recorded_at").eq("pickup_id", pickupId).maybeSingle());
export const subscribeToCollectorLocation = (pickupId, cb) =>
  channelFor("collector-loc", { event: "*", schema: "public", table: "collector_locations", filter: `pickup_id=eq.${pickupId}` }, cb);
