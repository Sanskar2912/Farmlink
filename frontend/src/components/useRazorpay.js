import { useAuth } from "./AuthContext";

// Dynamically loads Razorpay checkout script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export function useRazorpay() {
  const { authFetch } = useAuth();

  // ── Pay for an equipment BOOKING ──────────────────────────────────────
  const payForBooking = async ({ bookingId, onSuccess, onFailure }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.("Could not load payment gateway. Check your internet connection.");
      return;
    }

    try {
      // Step 1: Create Razorpay order on our server
      const res  = await authFetch("/api/payments/booking/create-order", {
        method: "POST",
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Step 2: Open Razorpay checkout
      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "FarmLink",
        description: `Rental: ${data.name}`,
        order_id:    data.orderId,
        prefill:     data.prefill,
        theme:       { color: "#3B6D11" },
        handler: async (response) => {
          // Step 3: Verify payment on our server
          try {
            const verifyRes = await authFetch("/api/payments/booking/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                bookingId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message);
            onSuccess?.(verifyData.booking);
          } catch (err) {
            onFailure?.(err.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => onFailure?.("Payment cancelled."),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onFailure?.(err.message || "Payment failed. Please try again.");
    }
  };

  // ── Pay for a product ORDER ────────────────────────────────────────────
  const payForOrder = async ({ items, deliveryAddress, onSuccess, onFailure }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.("Could not load payment gateway.");
      return;
    }

    try {
      const res  = await authFetch("/api/payments/order/create-order", {
        method: "POST",
        body: JSON.stringify({ items, deliveryAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "FarmLink",
        description: "Product Purchase",
        order_id:    data.orderId,
        prefill:     data.prefill,
        theme:       { color: "#3B6D11" },
        handler: async (response) => {
          try {
            const verifyRes = await authFetch("/api/payments/order/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                dbOrderId:           data.dbOrderId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.message);
            onSuccess?.(verifyData.order);
          } catch (err) {
            onFailure?.(err.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: () => onFailure?.("Payment cancelled."),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      onFailure?.(err.message || "Payment failed. Please try again.");
    }
  };

  return { payForBooking, payForOrder };
}
