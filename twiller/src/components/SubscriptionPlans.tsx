"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axiosInstance";
import { Button } from "./ui/button";

const PLANS = [
  { name: "Free",   price: 0,    tweets: "1 tweet",      color: "border-gray-600" },
  { name: "Bronze", price: 100,  tweets: "3 tweets",     color: "border-yellow-600" },
  { name: "Silver", price: 300,  tweets: "5 tweets",     color: "border-gray-400" },
  { name: "Gold",   price: 1000, tweets: "Unlimited",    color: "border-yellow-400" },
];

export default function SubscriptionPlans({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState("");

  const handleSubscribe = async (plan: any) => {
    if (plan.price === 0) return;
    setLoading(plan.name);
    try {
      const orderRes = await axiosInstance.post("/create-order", {
        amount: plan.price,
        currency: "INR",
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
        amount: orderRes.data.amount,
        currency: "INR",
        name: "Twiller",
        description: `${plan.name} Plan Subscription`,
        order_id: orderRes.data.id,
        handler: async (response: any) => {
          await axiosInstance.post("/verify-payment", {
            ...response,
            email: user?.email,
            plan: plan.name,
          });
          alert(`✅ ${plan.name} plan activated! Check your email/logs for invoice.`);
          onClose();
        },
        prefill: { email: user?.email },
        theme: { color: "#1d9bf0" },
      };

      // Fallback for simulated/mock environment if Razorpay is not loaded or in mock mode
      if (!(window as any).Razorpay) {
        console.log("Simulating Razorpay Payment verification...");
        // Directly hit verify payment with mock order/payment ID
        await axiosInstance.post("/verify-payment", {
          razorpay_order_id: orderRes.data.id,
          razorpay_payment_id: "pay_mock" + Math.random().toString(36).substring(2, 10),
          razorpay_signature: "mock_signature",
          email: user?.email,
          plan: plan.name,
        });
        alert(`✅ [DEMO] ${plan.name} plan activated! Check server console for simulated invoice.`);
        onClose();
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.response?.data?.error || "Payment failed");
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <p className="text-yellow-500 text-sm mb-6 text-center">
          ⏰ Payments only allowed between 10:00 AM – 11:00 AM IST
        </p>

        <div className="grid grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <div key={plan.name} className={`border ${plan.color} rounded-xl p-4 bg-gray-800 flex flex-col justify-between`}>
              <div>
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <p className="text-blue-400 font-semibold text-xl mt-1">
                  {plan.price === 0 ? "Free" : `₹${plan.price}/mo`}
                </p>
                <p className="text-gray-400 text-sm mt-1">{plan.tweets}/month limit</p>
              </div>
              {user?.plan === plan.name ? (
                <div className="mt-4 text-center text-green-400 text-sm font-semibold py-2">
                  ✅ Current Plan
                </div>
              ) : plan.price === 0 ? (
                <div className="mt-4 text-center text-gray-500 text-sm py-2">Default Plan</div>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.name}
                  className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 text-white rounded-full text-sm font-semibold"
                >
                  {loading === plan.name ? "Processing..." : "Subscribe"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
