'use client';

import { useCart } from '@/lib/store';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import styles from '@/styles/cart.module.css';
import { calculateShipping } from '@/lib/shipping';
import Footer from '@/components/Footer';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCart();

  const subtotal = getTotalPrice();
  const shippingCost = calculateShipping();
  const total = subtotal + shippingCost;

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <div className={styles.cartContainer}>
          <div className={styles.emptyCart}>
            <h2>Your Cart is Empty</h2>
            <p>Start shopping to add items to your cart</p>
            <Link href="/products" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />

      <div className={styles.cartContainer}>
        <h1 className={styles.pageTitle}>SHOPPING CART</h1>

        <div className={styles.cartLayout}>
          <div className={styles.cartItems}>
            {items.map((item) => {
              const price = item.product.price - item.product.discountAmount;

              return (
                <div key={item.product.id} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {item.product.images[0] && (
                      <img src={item.product.images[0]} alt={item.product.name} />
                    )}
                  </div>

                  <div className={styles.itemDetails}>
                    <div>
                      <p className={styles.itemBrand}>{item.product.brand.name}</p>
                      <h3 className={styles.itemName}>{item.product.name}</h3>
                      <p className={styles.itemMeta}>
                        {item.product.concentration} • {item.product.size}ml
                      </p>
                    </div>
                    <div>
                      <p className={styles.itemPrice}>€{price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className={styles.itemControls}>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className={styles.removeButton}
                    >
                      Remove
                    </button>

                    <div className={styles.quantityControl}>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className={styles.quantityButton}
                      >
                        -
                      </button>
                      <span className={styles.quantity}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className={styles.quantityButton}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.orderSummary}>
            <h2>ORDER SUMMARY</h2>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subtotal</span>
              <span className={styles.summaryValue}>€{subtotal.toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Shipping</span>
              <span className={styles.summaryValue}>€{shippingCost.toFixed(2)}</span>
            </div>

            <hr className={styles.summaryDivider} />

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span className={styles.summaryLabel}>Total</span>
              <span className={styles.summaryValue}>€{total.toFixed(2)}</span>
            </div>

            <Link href="/checkout" className={styles.checkoutButton}>
              PROCEED TO CHECKOUT
            </Link>

            <Link href="/products" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      <Navbar />
    </div>
  );
}
