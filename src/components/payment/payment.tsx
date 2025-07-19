"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { getUserByKindeId } from "@/actions/userActions";


export default function PayPage() {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<number>(0); // Amount input by the user
    const { user: kindeUser } = useKindeBrowserClient();
  
    useEffect(() => {
      const fetchUser = async () => {
        if (kindeUser?.id) {
          try {
            const fetchedUser = await getUserByKindeId(kindeUser.id); // Safe to call because we checked for undefined
            console.log('user:', fetchedUser);
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        } else {
          console.warn("No user ID available");
        }
      };
  
      fetchUser();
    }, [kindeUser]);
  const handlePayment = async () => {
    const confirm = window.confirm("Do you want to proceed to payment?");
    if (!confirm) return;




    if (amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: amount * 100 }), // Convert to cents
      });

      const { sessionId } = await res.json();

      if (sessionId) {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );
        await stripe?.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Proceed to Payment</h1>
        <input
          type="number"
          placeholder="Enter amount (in USD)"
          className="border rounded-lg px-4 py-2 mb-4"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <button
          onClick={handlePayment}
          className={`px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg ${
            loading ? "cursor-not-allowed opacity-50" : "hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </div>
  );
}
