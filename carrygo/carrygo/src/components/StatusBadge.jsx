import React from "react";
import { STATUS_LABELS } from "../lib/format";

export default function StatusBadge({ status }) {
  return <span className={`cg-status cg-status-${status}`}>{STATUS_LABELS[status] || status}</span>;
}
