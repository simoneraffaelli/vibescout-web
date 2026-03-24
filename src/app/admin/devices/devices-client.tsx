"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Device {
  id: number;
  name: string;
  apiKeyPrefix: string;
  enabled: boolean;
  createdAt: string;
  _count: { tracks: number };
}

export default function DevicesClient() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedNew, setCopiedNew] = useState(false);
  const router = useRouter();

  async function fetchDevices() {
    const res = await fetch("/api/admin/devices");
    if (res.status === 401) {
      router.push("/admin");
      return;
    }
    setDevices(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchDevices();
  }, []);

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      // Show the full API key once — it won't be available again
      setNewlyCreatedKey(data.apiKey);
      setCopiedNew(false);
    }
    setNewName("");
    fetchDevices();
  }

  async function toggleDevice(id: number, enabled: boolean) {
    await fetch(`/api/admin/devices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchDevices();
  }

  async function deleteDevice(id: number) {
    if (!confirm("Delete this device and revoke its API key?")) return;
    await fetch(`/api/admin/devices/${id}`, { method: "DELETE" });
    fetchDevices();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  function copyNewKey() {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Device Management
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {devices.length} device{devices.length !== 1 && "s"} registered
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Newly created key banner */}
        {newlyCreatedKey && (
          <div className="mb-6 rounded-lg border border-yellow-700 bg-yellow-950 px-5 py-4">
            <p className="text-sm font-semibold text-yellow-300">
              Save this API key now — it won&apos;t be shown again!
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200">
                {newlyCreatedKey}
              </code>
              <button
                onClick={copyNewKey}
                className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
              >
                {copiedNew ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="mt-2 text-xs text-yellow-400 underline hover:text-yellow-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Add device form */}
        <form onSubmit={addDevice} className="mb-8 flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Device name (e.g. Simon's Pixel)"
            maxLength={100}
            className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            required
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Add Device
          </button>
        </form>

        {/* Device list */}
        {devices.length === 0 ? (
          <p className="py-20 text-center text-zinc-500">
            No devices yet. Add one above to get an API key.
          </p>
        ) : (
          <ul className="space-y-3">
            {devices.map((device) => (
              <li
                key={device.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {device.name}
                      <span
                        className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs ${
                          device.enabled
                            ? "bg-green-900 text-green-300"
                            : "bg-red-900 text-red-300"
                        }`}
                      >
                        {device.enabled ? "Active" : "Disabled"}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {device._count.tracks} tracks · Created{" "}
                      {new Date(device.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDevice(device.id, !device.enabled)}
                      className="rounded border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-100"
                    >
                      {device.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => deleteDevice(device.id)}
                      className="rounded border border-red-800 px-2 py-1 text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Masked API key prefix */}
                <div className="mt-3">
                  <code className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-500">
                    {device.apiKeyPrefix}
                  </code>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
