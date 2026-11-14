import React from "react";
import AuthForm from "../components/AuthForm";

export default function CustomerAuthPage({ onBack, onSuccess }) {
  return (
    <AuthForm
      role="customer"
      kicker="Customer account"
      subtitle="Sign in to book a pickup, track it live, and see your history."
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}
