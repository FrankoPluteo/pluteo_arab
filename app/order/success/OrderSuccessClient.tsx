"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/languageContext";
import { onConsentChange } from "@/lib/consent";
import { trackMetaEvent } from "@/lib/metaPixel";
import styles from "@/styles/ordersuccess.module.css";

/** A paid order, as confirmed server side in page.tsx. */
export interface PurchaseData {
  orderId: string;
  value: number;
  contents: { id: string; quantity: number; item_price: number }[];
}

/**
 * Fires Purchase once per order. The order ID is the eventID, so Meta also drops
 * duplicates, and a localStorage flag stops refreshes and revisits from re-sending.
 * Without consent nothing is sent; if the visitor accepts on this page, it fires then.
 */
function usePurchaseEvent(purchase: PurchaseData | null) {
  useEffect(() => {
    if (!purchase) return;
    const flag = `meta_purchase_sent:${purchase.orderId}`;

    const fire = () => {
      try {
        if (localStorage.getItem(flag)) return;
      } catch {
        // without storage, the eventID still lets Meta deduplicate
      }
      const sent = trackMetaEvent(
        "Purchase",
        {
          value: purchase.value,
          currency: "EUR",
          content_type: "product",
          content_ids: [...new Set(purchase.contents.map((c) => c.id))],
          contents: purchase.contents,
          num_items: purchase.contents.reduce((sum, c) => sum + c.quantity, 0),
        },
        { eventID: purchase.orderId }
      );
      if (sent) {
        try {
          localStorage.setItem(flag, "1");
        } catch {
          // see above
        }
      }
    };

    fire();
    return onConsentChange((state) => {
      if (state.marketing) fire();
    });
  }, [purchase]);
}

export default function OrderSuccessClient({ purchase }: { purchase: PurchaseData | null }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  usePurchaseEvent(purchase);

  useEffect(() => {
    setLoading(false);
  }, [sessionId]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className={styles.container}>{t.orderSuccess.loading}</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.checkmark}>✓</div>
          <h1 className={styles.title}>{t.orderSuccess.title}</h1>
          <p className={styles.message}>{t.orderSuccess.message}</p>

          <div className={styles.actions}>
            <Link href="/products" className={styles.primaryButton}>
              {t.orderSuccess.continueShopping}
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              {t.orderSuccess.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
