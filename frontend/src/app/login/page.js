"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card, {
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/Card";
import { FaSyncAlt, FaGithub, FaExclamationTriangle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (form.username === "admin" && form.password === "password") {
        router.push("/");
      } else {
        setError("Invalid username or password.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    await signIn("github");
  };

  const handleGoogleLogin = async () => {
    await signIn("google");
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "OAuthAccountNotLinked") {
      setError(
        "This email is already associated with another login method. Please use the originally linked provider."
      );
    }
  }, [searchParams]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardTitle className="mb-2 pointer-events-none">Login</CardTitle>
          <CardDescription className="pointer-events-none">
            {/* Please enter your credentials or login with a provider. */}
            Sign in with your preferred provider below.
          </CardDescription>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 mt-4">
              {error && (
                <div className="bg-red-900/50 p-4 flex w-full items-center justify-center rounded-lg gap-2 text-yellow-400 ">
                  <FaExclamationTriangle />
                  <span className="text-foreground">{error}</span>
                </div>
              )}

              {/* <button
                type="button"
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 border border-gray-border rounded-lg py-2 bg-surface hover:bg-surface-hover transition-all text-white px-4 relative"
              >
                <Image
                  src="/images/logo/porto-icon.svg"
                  alt="Porto Logo"
                  width={20}
                  height={20}
                  priority
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                />
                Login with Porto
              </button> */}
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 border border-gray-border rounded-lg py-2 bg-surface hover:bg-surface-hover transition-all text-white px-4 relative"
              >
                <FaGithub className="text-xl absolute left-4 top-1/2 -translate-y-1/2" />
                Login with GitHub
              </button>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 border border-gray-border rounded-lg py-2 bg-surface hover:bg-surface-hover transition-all text-white px-4 relative"
              >
                <FcGoogle className="text-xl absolute left-4 top-1/2 -translate-y-1/2" />
                Login with Google
              </button>
            </div>
            <div className="relative text-center my-4 pointer-events-none hidden">
              <hr className="border-gray-border" />
              <p className="absolute transform top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-surface text-sm text-gray-400 px-4">
                OR
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              autoComplete="off"
              className="flex flex-col gap-4 opacity-30 cursor-not-allowed hidden"
            >
              <div>
                <label
                  htmlFor="username"
                  className="block mb-1 text-sm text-gray-400"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  disabled
                  // autoFocus
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block mb-1 text-sm text-gray-400"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full py-2 px-3 border border-gray-border rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>
              <button
                type="submit"
                className={`border-2 rounded-lg transition-all h-12 w-full mt-2 ${
                  !isLoading
                    ? "bg-primary hover:bg-primary-hover border-primary hover:border-primary-hover"
                    : "bg-gray-500 border-gray-500 cursor-not-allowed"
                }`}
                disabled
              >
                {isLoading ? (
                  <FaSyncAlt className="animate-spin mx-auto text-base" />
                ) : (
                  "Login"
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
