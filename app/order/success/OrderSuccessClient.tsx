"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/languageContext";
import styles from "@/styles/ordersuccess.module.css";

export default function OrderSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

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
