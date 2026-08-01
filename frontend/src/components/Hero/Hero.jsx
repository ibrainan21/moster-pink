import styles from "./Hero.module.css";
import banner from "../../assets/images/banners/monster-pink-banner.jpeg";

function Hero() {
  return (
    <section className={styles.hero}>
      <img
        src={banner}
        alt="Monster Pink"
        className={styles.banner}
      />
    </section>
  );
}

export default Hero;