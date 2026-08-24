import { useState } from "react";
import { Search, ShieldCheck, ShieldOff, Lock } from "lucide-react";
import useFetch from "../../../hooks/useFetch";
import useDebouncedValue from "../../../hooks/useDebouncedValue";
import userService from "../../../services/user.service";
import { useAuth } from "../../../context/AuthContext";
import styles from "./AdminUsers.module.css";

const PAGE_SIZE = 20;

const ROLES = ["Administrador", "Empleado", "Cliente"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("es-MX", { dateStyle: "medium" }) : "—";

/**
 * AdminUsers
 * /admin/usuarios — RF-004, CU-027. Usa GET /api/users (con filtros de
 * rol/estado/búsqueda que el backend sí soporta) y PATCH /:id/status,
 * PATCH /:id/role. No hay endpoint de creación ni borrado: los usuarios se
 * registran solos (RF-001) y por RN-004 nunca se eliminan físicamente,
 * solo se bloquean.
 */
function AdminUsers() {
  const { user: currentUser } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");

  // Se usa para forzar un refetch después de bloquear/activar o cambiar un
  // rol, sin duplicar aquí la lógica de carga que ya tiene useFetch.
  const [reloadTick, setReloadTick] = useState(0);

  const { data, loading, error } = useFetch(
    (signal) =>
      userService.list(
        {
          page,
          limit: PAGE_SIZE,
          role: roleFilter || undefined,
          isActive: statusFilter || undefined,
          search: debouncedSearch.trim() || undefined,
        },
        signal
      ),
    [page, roleFilter, statusFilter, debouncedSearch, reloadTick]
  );

  const users = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reinicia a la página 1 cuando cambian los filtros (evita quedar
  // "atrapado" en una página 3 que ya no existe con el nuevo filtro).
  const [prevFilters, setPrevFilters] = useState(`${roleFilter}|${statusFilter}|${debouncedSearch}`);
  const filtersKey = `${roleFilter}|${statusFilter}|${debouncedSearch}`;
  if (prevFilters !== filtersKey) {
    setPrevFilters(filtersKey);
    if (page !== 1) setPage(1);
  }

  const refresh = () => setReloadTick((t) => t + 1);

  const handleToggleActive = async (targetUser) => {
    setActionError("");
    try {
      await userService.setActive(targetUser.id, !targetUser.is_active);
      refresh();
    } catch (err) {
      // El backend ya explica por qué no se puede (p.ej. "no puedes
      // desactivar tu propia cuenta") -- se muestra tal cual, sin
      // reinterpretarlo.
      setActionError(err.message || "No pudimos actualizar el estado del usuario.");
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (newRole === targetUser.role_name) return;
    setActionError("");
    try {
      await userService.updateRole(targetUser.id, newRole);
      refresh();
    } catch (err) {
      setActionError(err.message || "No pudimos actualizar el rol del usuario.");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Usuarios</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Todos los roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Bloqueados</option>
        </select>
      </div>

      {actionError && <p className={styles.actionError}>{actionError}</p>}

      {loading && <p className={styles.state}>Cargando usuarios...</p>}
      {error && <p className={styles.state}>No pudimos cargar los usuarios.</p>}
      {!loading && !error && users.length === 0 && (
        <p className={styles.state}>No hay usuarios con esos filtros.</p>
      )}

      {!loading && users.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th>Último acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;

                return (
                  <tr key={u.id} className={styles.row}>
                    <td className={styles.name}>
                      {u.first_name} {u.last_name}
                      {isSelf && <span className={styles.youTag}>Tú</span>}
                    </td>
                    <td className={styles.muted}>{u.email}</td>
                    <td>
                      <select
                        value={u.role_name}
                        disabled={isSelf}
                        title={isSelf ? "No puedes cambiar tu propio rol." : undefined}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className={styles.roleSelect}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          u.is_active ? styles.statusActive : styles.statusBlocked
                        }`}
                      >
                        {u.is_active ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className={styles.muted}>{formatDate(u.created_at)}</td>
                    <td className={styles.muted}>{formatDate(u.last_login)}</td>
                    <td>
                      <button
                        type="button"
                        className={`${styles.actionButton} ${
                          u.is_active ? styles.blockButton : styles.activateButton
                        }`}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? "No puedes bloquear tu propia cuenta."
                            : u.is_active
                            ? "Bloquear usuario"
                            : "Activar usuario"
                        }
                        onClick={() => handleToggleActive(u)}
                      >
                        {isSelf ? (
                          <Lock size={14} />
                        ) : u.is_active ? (
                          <ShieldOff size={14} />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        {u.is_active ? "Bloquear" : "Activar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
