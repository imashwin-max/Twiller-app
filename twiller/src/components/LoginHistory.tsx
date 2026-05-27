"use client";
import { useAuth } from "@/context/AuthContext";

export default function LoginHistory() {
  const { user } = useAuth();
  const history = (user as any)?.loginHistory || [];

  return (
    <div className="p-4 text-white">
      <h3 className="text-white font-bold text-lg mb-4">🔐 Login History</h3>
      {history.length === 0 ? (
        <p className="text-gray-500 text-sm">No login history available.</p>
      ) : (
        <div className="space-y-3">
          {[...history].reverse().map((entry: any, i: number) => (
            <div
              key={i}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm flex items-center space-x-2">
                  <span>
                    {entry.device === "mobile" ? "📱" : "🖥️"}
                  </span>
                  <span className="capitalize">{entry.device || "Desktop"}</span>
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(entry.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Browser: </span>
                  <span className="text-gray-300">{entry.browser}</span>
                </div>
                <div>
                  <span className="text-gray-500">OS: </span>
                  <span className="text-gray-300">{entry.os}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">IP: </span>
                  <span className="text-gray-300">{entry.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
