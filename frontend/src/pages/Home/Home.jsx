import Header from "../../components/Header/Header";
import Hero from "../../components/Hero/Hero";

import styles from "./Home.module.css";

function Home() {

  return (
    <div className={styles.home}>

      <Header />

      <Hero />

    </div>
  );

}

export default Home;