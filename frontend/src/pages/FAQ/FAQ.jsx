import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import styles from "./FAQ.module.css";

// Contenido estático: no existe todavía una tabla de FAQ en el backend, así
// que estas preguntas viven aquí. Si más adelante se quiere que el admin
// las edite desde el panel, se movería a un módulo de contenido nuevo
// (parecido a banners/gallery en backend/src/modules/content/).
const FAQ_ITEMS = [
  {
    question: "¿Cuánto tarda mi pedido en llegar?",
    answer:
      "El tiempo de entrega depende de tu ubicación, pero en promedio los pedidos llegan entre 2 y 5 días hábiles después de que el pago se confirma. Puedes revisar el estado exacto de tu pedido en la sección de Seguimiento.",
  },
  {
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de crédito y débito, así como saldo en Mercado Pago, a través de un checkout seguro. Tu pedido se confirma automáticamente en cuanto el pago es aprobado.",
  },
  {
    question: "¿Puedo personalizar mi regalo?",
    answer:
      "Sí, muchos de nuestros productos se pueden personalizar con texto, colores o empaque especial. Visita la sección de Personalizados para ver las opciones disponibles.",
  },
  {
    question: "¿Cómo hago un cambio o devolución?",
    answer:
      "Tienes hasta 5 días después de recibir tu pedido para solicitar un cambio o devolución, siempre que el producto no haya sido usado. Consulta los detalles completos en la sección de Cambios y devoluciones.",
  },
  {
    question: "¿Cómo sé si mi pago ya se confirmó?",
    answer:
      "En cuanto Mercado Pago aprueba tu pago, tu pedido cambia de \"Pendiente de pago\" a \"Pagado\" automáticamente, y puedes verlo en Mi cuenta > Mis pedidos.",
  },
  {
    question: "¿Hacen envíos a todo México?",
    answer:
      "Sí, hacemos envíos a toda la República Mexicana. El costo de envío y si aplica envío gratis se calculan en tu carrito antes de pagar.",
  },
];

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className={styles.item}>
      <button type="button" className={styles.question} onClick={onToggle}>
        <span>{item.question}</span>
        <ChevronDown size={20} className={isOpen ? styles.chevronOpen : styles.chevron} />
      </button>
      {isOpen && <p className={styles.answer}>{item.answer}</p>}
    </div>
  );
}

/**
 * FAQ
 * Ruta pública /preguntas-frecuentes. Acordeón simple con contenido
 * estático (ver comentario arriba de FAQ_ITEMS).
 */
function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        <h1 className={styles.title}>Preguntas frecuentes</h1>
        <p className={styles.subtitle}>
          Resolvemos las dudas más comunes. Si no encuentras lo que buscas, escríbenos en Contacto.
        </p>

        <div className={styles.list}>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FAQ;
