"use client";

import { useState } from "react";

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
        userId: data.emailId,
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
    <form
      onSubmit={handleSubmit}
      className="container mx-auto flex flex-col gap-4 max-w-xl py-12"
    >
      <div className="bg-white rounded-lg shadow p-8 flex flex-col gap-6">
        <div className="mb-4">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create Eligible User
          </h2>
          <p className="text-sm text-gray-600">
            Add user emails to the eligible list before they sign in
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
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
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Success
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    {message.text}
                    <br />
                    <span className="font-mono text-xs">
                      Email ID: {message.userId}
                    </span>
                    {message.existed && (
                      <div className="mt-1 text-xs">
                        (Email was already in the eligible list)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-row justify-end items-center gap-4 mt-4">
          <button
            type="submit"
            disabled={loading}
            className={`border-2 rounded-lg transition-all h-12 w-40 text-white text-base font-semibold ${
              !loading
                ? "bg-blue-600 hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                : "bg-gray-400 border-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? "Creating..." : "Create Eligible User"}
          </button>
        </div>
        <div className="mt-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">How it works</span>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              • Emails added here will be checked when users sign in with OAuth
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
        </div>
      </div>
    </form>
  );
}
