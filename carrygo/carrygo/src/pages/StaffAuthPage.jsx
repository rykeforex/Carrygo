import React from "react";
import AuthForm from "../components/AuthForm";

export default function StaffAuthPage({ onBack }) {
  return <AuthForm role="staff" kicker="Staff sign-in" subtitle="For CarryGo administrators. Staff accounts can't be created here." onBack={onBack} allowSignup={false} />;
}
