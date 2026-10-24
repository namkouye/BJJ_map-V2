import { ROLES, ROLE_LABELS, ROLE_LABELS_FR } from '../graph/labels';
import { useStore } from '../store/useStore';

/** Curseur « On top / On bottom » : change le point de vue sur la carte. */
export function RoleToggle() {
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);

  return (
    <div className="role-toggle" role="radiogroup" aria-label="Point de vue" data-role={role}>
      <span className="role-thumb" aria-hidden />
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={role === r}
          className={role === r ? 'on' : ''}
          onClick={() => setRole(r)}
        >
          <b>{ROLE_LABELS[r]}</b>
          <small>{ROLE_LABELS_FR[r]}</small>
        </button>
      ))}
    </div>
  );
}
