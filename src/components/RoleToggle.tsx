import { ROLES, ROLE_LABELS } from '../graph/labels';
import { useI18n } from '../i18n/useI18n';
import { useStore } from '../store/useStore';

/** Curseur « On top / On bottom » : change le point de vue sur la carte. */
export function RoleToggle() {
  const { t, roleSub } = useI18n();
  const role = useStore((s) => s.role);
  const setRole = useStore((s) => s.setRole);

  return (
    <div className="role-toggle" role="radiogroup" aria-label={t('viewpoint')} data-role={role}>
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
          <small>{roleSub(r)}</small>
        </button>
      ))}
    </div>
  );
}
