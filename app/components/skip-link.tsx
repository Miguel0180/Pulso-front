"use client";

import styles from "./skip-link.module.css";

export default function SkipLink() {
  return (
    <a href="#conteudo-principal" className={styles.skipLink}>
      Ir para o conteúdo
    </a>
  );
}
