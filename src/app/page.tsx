"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<{ message?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) {
      setError("NEXT_PUBLIC_BACKEND_URL is not configured");
      setLoading(false);
      return;
    }
    fetch(backendUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h1>Backend Response</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
