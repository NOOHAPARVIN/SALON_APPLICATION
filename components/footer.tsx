 
"use client";
import Image from "next/image";
import { useState } from "react";
import styles from "./Footer.module.css";

const images: string[] = [
  "/images/1.jpeg",
  "/images/2.jpeg",
  "/images/3.jpeg",
  "/images/4.jpeg",
  "/images/5.jpeg",
  "/images/6.jpeg",
];

export default function Footer() {
  const [current, setCurrent] = useState<number>(0);

  const nextSlide = (): void => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (): void => {
    setCurrent((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <footer className={styles.footer}>
      <h2>Our Styles</h2>

      <div className={styles.slider}>
        <button onClick={prevSlide} className={styles.btn}>
          ◀
        </button>

        <div className={styles.imageContainer}>
  <Image
    src={images[current]}
    alt="Salon style"
    width={300}
    height={200}
    className={styles.image}
  />
</div>

        <button onClick={nextSlide} className={styles.btn}>
          ▶
        </button>
      </div>

      <p>© 2026 Salon App. All rights reserved.</p>
    </footer>
  );
}