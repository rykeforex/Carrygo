import React, { useEffect } from "react";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export default function StaffAuthPage({ onBack }) {
  const { authNotice, clearAuthNotice } = useAuth();

  // Never carry a previous denial message into a later visit.
  useEffect(() => () => clearAuthNotice(), [clearAuthNotice]);

  return (
    <AuthForm
      role="staff"
      kicker="Restricted access"
      subtitle="Authorised CarryGo staff only. Accounts can't be created here."
      onBack={onBack}
      allowSignup={false}
      externalError={authNotice}
    />
  );
}
