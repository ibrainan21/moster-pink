import { Component } from "react";
import styles from "./ErrorBoundary.module.css";

/**
 * ErrorBoundary
 * Red de seguridad para toda la app: si un error de renderizado no
 * capturado tumba el árbol de React (por ejemplo, una extensión del
 * navegador como Google Translate reescribiendo el DOM por fuera de
 * React, causando errores tipo "Failed to execute 'insertBefore' on
 * 'Node'"), en vez de dejar al cliente con una pantalla en blanco sin
 * explicación, se muestra un mensaje simple con un botón para recargar.
 *
 * No cambia nada del comportamiento normal de la app: solo entra en
 * acción si React ya iba a tronar de todos modos.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Nos quedamos solo con el log en consola (no hay servicio de
    // reporte de errores configurado todavía en el proyecto).
    console.error("ErrorBoundary capturó un error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper}>
          <h1>Algo salió mal</h1>
          <p>
            Tuvimos un problema al mostrar esta página. Si tienes activo un traductor u otra
            extensión del navegador, intenta desactivarlo para este sitio.
          </p>
          <button onClick={this.handleReload} className={styles.button}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
