import Header from "../../components/Header/Header";
import Hero from "../../components/Hero/Hero";
import Categories from "../../components/Categories/Categories";
import BestSellers from "../../components/BestSellers/BestSellers";
import PersonalizedGift from "../../components/PersonalizedGift/PersonalizedGift";
import SeasonalOffers from "../../components/SeasonalOffers/SeasonalOffers";
import Testimonials from "../../components/Testimonials/Testimonials";
import InstagramGallery from "../../components/InstagramGallery/InstagramGallery";
import Location from "../../components/Location/Location";
import Footer from "../../components/Footer/Footer";

import styles from "./Home.module.css";

function Home() {

  return (
    <div className={styles.home}>

      <Header />

      <Hero />

      <Categories />

      <BestSellers />

      <PersonalizedGift />

      <SeasonalOffers />

      <Testimonials />

      <InstagramGallery />

      <Location />

      <Footer />

    </div>
  );

}

export default Home;
