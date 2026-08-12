import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock } from "lucide-react";
import Header from "../../components/Header/Header";
import authService from "../../services/auth.service";
import { ApiClientError } from "../../services/api";
import styles from "./ForgotPassword.module.css";

/**
 * ForgotPassword
 * Flujo de dos pasos que refleja tal cual RF-003 del backend:
 *  1) el usuario pide un código (llega por correo -- o por consola si
 *     todavía usas el mailer.js de prueba).
 *  2) captura el código + su nueva contraseña.
 * No inicia sesión automáticamente al terminar: lo manda a /login para
 * que entre con su contraseña nueva, como cualquier flujo de recuperación.
 */
function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setInfo("Si el correo está registrado, te enviamos un código de recuperación.");
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo enviar el código.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authService.resetPassword(email, code, newPassword);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo actualizar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        {step === 1 ? (
          <form className={styles.card} onSubmit={requestCode}>
            <h1 className={styles.title}>Recupera tu contraseña</h1>
            <p className={styles.subtitle}>
              Ingresa tu correo y te enviaremos un código de 6 dígitos.
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <label className={styles.field}>
              <Mail size={18} />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar código"}
            </button>

            <p className={styles.footerText}>
              <Link to="/login">Volver a iniciar sesión</Link>
            </p>
          </form>
        ) : (
          <form className={styles.card} onSubmit={resetPassword}>
            <h1 className={styles.title}>Ingresa tu código</h1>
            <p className={styles.subtitle}>
              {info || `Revisa el código que enviamos a ${email}.`}
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <label className={styles.field}>
              <KeyRound size={18} />
              <input
                type="text"
                placeholder="Código de 6 dígitos"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </label>

            <label className={styles.field}>
              <Lock size={18} />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <button type="submit" className={styles.submitButton} disabled={submitting}>
              {submitting ? "Actualizando..." : "Actualizar contraseña"}
            </button>

            <p className={styles.footerText}>
              <button type="button" className={styles.linkButton} onClick={() => setStep(1)}>
                ¿No te llegó? Pedir otro código
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
