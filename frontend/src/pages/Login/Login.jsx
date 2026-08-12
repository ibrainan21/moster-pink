import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn } from "lucide-react";
import Header from "../../components/Header/Header";
import { useAuth } from "../../context/AuthContext";
import { ApiClientError } from "../../services/api";
import styles from "./Login.module.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(form.email, form.password);
      // Si llegamos aquí redirigidos por ProtectedRoute, regresamos a esa
      // página; si no, al Home.
      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Inicia sesión</h1>
          <p className={styles.subtitle}>Bienvenida de nuevo a Moster Pink 💕</p>

          {error && <p className={styles.error}>{error}</p>}

          <label className={styles.field}>
            <Mail size={18} />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.field}>
            <Lock size={18} />
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </label>

          <Link to="/recuperar-contrasena" className={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>

          <button type="submit" className={styles.submitButton} disabled={submitting}>
            <LogIn size={18} />
            {submitting ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p className={styles.footerText}>
            ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
