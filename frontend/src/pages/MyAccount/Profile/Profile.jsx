import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import userService from "../../../services/user.service";
import authService from "../../../services/auth.service";
import styles from "./Profile.module.css";

const ROLE_LABELS = {
  Administrador: "Administrador",
  Empleado: "Empleado",
  Cliente: "Cliente",
};

/**
 * Profile
 * /mi-cuenta/perfil. Edita los datos propios (PATCH /api/users/me) y,
 * aparte, permite cambiar la contraseña (POST /api/auth/change-password).
 * El AuthContext no se actualiza solo con la respuesta de /users/me, así
 * que aquí reflejamos el usuario editado con setUser vía el propio hook.
 */
function Profile() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    phone: user?.phone || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await userService.updateMe(form);
      updateUser(updated);
      setSuccess("Tus datos se actualizaron correctamente.");
    } catch (err) {
      setError(err.message || "No pudimos actualizar tu perfil.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess("Tu contraseña se actualizó correctamente.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err.message || "No pudimos cambiar tu contraseña.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Datos personales</h2>

        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>Correo</span>
          <span>{user?.email}</span>
        </div>
        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>Cuenta</span>
          <span>{ROLE_LABELS[user?.role_name] || user?.role_name}</span>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.field}>
              <span>Nombre</span>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Apellido</span>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>Teléfono</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="Opcional"
            />
          </label>

          <button type="submit" className={styles.saveButton} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Cambiar contraseña</h2>

        {passwordError && <p className={styles.error}>{passwordError}</p>}
        {passwordSuccess && <p className={styles.success}>{passwordSuccess}</p>}

        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <label className={styles.field}>
            <span>Contraseña actual</span>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
            />
          </label>

          <div className={styles.formRow}>
            <label className={styles.field}>
              <span>Nueva contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Confirmar nueva contraseña</span>
              <input
                type="password"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
              />
            </label>
          </div>

          <button type="submit" className={styles.saveButton} disabled={changingPassword}>
            {changingPassword ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default Profile;
