import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, UserPlus } from "lucide-react";
import Header from "../../components/Header/Header";
import { useAuth } from "../../context/AuthContext";
import { ApiClientError } from "../../services/api";
import styles from "./Register.module.css";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        if (err.details?.length) {
          const byField = {};
          err.details.forEach((d) => {
            byField[d.field] = d.message;
          });
          setFieldErrors(byField);
        }
      } else {
        setError("No se pudo crear la cuenta.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header />

      <div className={styles.wrapper}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Crea tu cuenta</h1>
          <p className={styles.subtitle}>Regístrate para comprar y guardar tus favoritos 💕</p>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.row}>
            <label className={styles.field}>
              <User size={18} />
              <input
                type="text"
                name="firstName"
                placeholder="Nombre"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </label>

            <label className={styles.field}>
              <User size={18} />
              <input
                type="text"
                name="lastName"
                placeholder="Apellidos"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </label>
          </div>

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
          {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}

          <label className={styles.field}>
            <Phone size={18} />
            <input
              type="tel"
              name="phone"
              placeholder="Teléfono (opcional)"
              value={form.phone}
              onChange={handleChange}
            />
          </label>

          <label className={styles.field}>
            <Lock size={18} />
            <input
              type="password"
              name="password"
              placeholder="Contraseña (mínimo 8 caracteres)"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}

          <label className={styles.field}>
            <Lock size={18} />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirma tu contraseña"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className={styles.submitButton} disabled={submitting}>
            <UserPlus size={18} />
            {submitting ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <p className={styles.footerText}>
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
