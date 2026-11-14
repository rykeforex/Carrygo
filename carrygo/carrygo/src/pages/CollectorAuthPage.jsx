import React from "react";
import AuthForm from "../components/AuthForm";

export default function CollectorAuthPage({ onBack, onSuccess }) {
  return (
    <AuthForm
      role="collector"
      kicker="Collector account"
      subtitle="Sign in to go online, accept jobs, and track your earnings."
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}
