"use client";

import { useState } from "react";
import Card, {
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/Card";

export default function CreateUserPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/create-eligible-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user");
      }

      setMessage({
        text: data.message,
        userId: data.userId,
        emailId: data.emailId,
        existed: data.existed,
      });
      setEmail(""); // Clear the form
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="container mx-auto flex flex-col gap-4 max-w-2xl"
      >
        <Card>
          <CardTitle className="mb-0">Create Eligible User</CardTitle>
          <CardDescription>
            Add user emails to the eligible list before they sign in
          </CardDescription>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                placeholder="user@example.com"
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-900/30 border border-red-700/50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-400">Error</h3>
                    <div className="mt-2 text-sm text-red-300">{error}</div>
                  </div>
                </div>
              </div>
            )}
            {message && (
              <div className="rounded-md bg-green-900/30 border border-green-700/50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-400">
                      Success
                    </h3>
                    <div className="mt-2 text-sm text-green-300">
                      {message.text}
                      <br />
                      <span className="font-mono text-xs">
                        User ID: {message.userId}
                      </span>
                      <br />
                      <span className="font-mono text-xs">
                        Eligible ID: {message.emailId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle className="mb-0">How it works</CardTitle>
          <CardDescription className="mb-0">
            Understanding the eligibility process
          </CardDescription>
          <CardContent>
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                • Emails added here will be checked when users sign in with
                OAuth
              </p>
              <p>
                • Users with eligible emails won&apos;t see the
                IneligibleUserModal
              </p>
              <p>
                • Users sign in with Google/GitHub - no pre-created accounts
                needed
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-row justify-end items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`border-2 rounded-lg transition-all h-12 px-6 ${
              !loading
                ? "bg-primary hover:bg-primary-hover border-primary hover:border-primary-hover text-white"
                : "bg-gray-500 border-gray-500 cursor-not-allowed text-gray-300"
            }`}
          >
            {loading ? "Creating..." : "Create Eligible User"}
          </button>
        </div>
      </form>
    </div>
  );
}
