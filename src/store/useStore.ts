import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mapIndex } from '../data/defaultMap';
import {
  addCustom,
  getSide,
  newProfile,
  otherRole,
  parseProfiles,
  parseSid,
  removeCustom,
  sid,
  togglePick,
} from '../graph/model';
import type { Lang, MoveKind, Profile, ProfilesExport, Role, StateId } from '../graph/types';
import { detectLang } from '../i18n/ui';

export type Mode = 'explore' | 'game';

const uid = () => `p-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const firstProfile = (): Profile => newProfile(uid(), 'Mon jeu');

interface State {
  profiles: Profile[];
  activeId: string;
  role: Role;
  mode: Mode;
  lang: Lang;
  /** Technique ou soumission ouverte au centre de la carte (techKey / finId) ; non persistée */
  selItem: string | null;
  /** Position sélectionnée (non persistée) */
  selected: StateId | null;
  /** Types de mouvements affichés ; vide = tous (non persisté) */
  kindFilter: MoveKind[];

  setMode: (mode: Mode) => void;
  setLang: (lang: Lang) => void;
  setRole: (role: Role) => void;
  select: (id: StateId | null, item?: string | null) => void;
  toggleKind: (kind: MoveKind) => void;
  clearKinds: () => void;

  setActive: (id: string) => void;
  createProfile: (name: string) => void;
  renameProfile: (id: string, name: string) => void;
  duplicateProfile: (id: string) => void;
  deleteProfile: (id: string) => void;

  togglePick: (key: string) => void;
  addCustom: (moveId: string, name: string) => void;
  removeCustom: (moveId: string, name: string) => void;
  setStart: (role: Role, id: StateId | null) => void;

  exportData: () => ProfilesExport;
  /** Retourne la liste d'erreurs (vide si l'import a réussi). */
  importData: (raw: unknown) => string[];
  resetProfiles: () => void;
}

const initial = firstProfile();

function updateActive(s: State, fn: (p: Profile) => Profile): Pick<State, 'profiles'> {
  return { profiles: s.profiles.map((p) => (p.id === s.activeId ? fn(p) : p)) };
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profiles: [initial],
      activeId: initial.id,
      role: 'bottom',
      mode: 'explore',
      lang: detectLang(),
      selItem: null,
      selected: null,
      kindFilter: [],

      setMode: (mode) => set({ mode }),
      setLang: (lang) => set({ lang }),

      setRole: (role) =>
        set((s) => {
          let selected = s.selected;
          const cur = selected ? parseSid(selected) : null;
          if (cur && cur.role !== role) {
            const mirrored = sid(cur.position, role);
            selected = getSide(mapIndex, mirrored) ? mirrored : null;
          }
          return { role, selected, selItem: null };
        }),

      select: (id, item = null) =>
        set((s) => {
          const p = id ? parseSid(id) : null;
          return { selected: id, selItem: id ? item : null, role: p ? p.role : s.role };
        }),

      toggleKind: (kind) =>
        set((s) => ({
          kindFilter: s.kindFilter.includes(kind)
            ? s.kindFilter.filter((k) => k !== kind)
            : [...s.kindFilter, kind],
        })),

      clearKinds: () => set({ kindFilter: [] }),

      setActive: (id) => set((s) => (s.profiles.some((p) => p.id === id) ? { activeId: id } : s)),

      createProfile: (name) => {
        const p = newProfile(uid(), name.trim() || 'Nouveau jeu');
        set((s) => ({ profiles: [...s.profiles, p], activeId: p.id }));
      },

      renameProfile: (id, name) =>
        set((s) => ({
          profiles: s.profiles.map((p) => (p.id === id && name.trim() ? { ...p, name: name.trim() } : p)),
        })),

      duplicateProfile: (id) =>
        set((s) => {
          const src = s.profiles.find((p) => p.id === id);
          if (!src) return s;
          const copy: Profile = {
            ...structuredClone(src),
            id: uid(),
            name: `${src.name} (copie)`,
          };
          return { profiles: [...s.profiles, copy], activeId: copy.id };
        }),

      deleteProfile: (id) =>
        set((s) => {
          if (s.profiles.length <= 1) return s;
          const profiles = s.profiles.filter((p) => p.id !== id);
          return { profiles, activeId: s.activeId === id ? profiles[0].id : s.activeId };
        }),

      togglePick: (key) => set((s) => updateActive(s, (p) => togglePick(p, key))),
      addCustom: (mid, name) => set((s) => updateActive(s, (p) => addCustom(p, mid, name))),
      removeCustom: (mid, name) => set((s) => updateActive(s, (p) => removeCustom(p, mid, name))),

      setStart: (role, id) =>
        set((s) =>
          updateActive(s, (p) => {
            const starts = { ...p.starts };
            if (id) starts[role] = id;
            else delete starts[role];
            return { ...p, starts };
          }),
        ),

      exportData: () => ({
        app: 'bjj-game-map',
        kind: 'profiles',
        exportedAt: new Date().toISOString(),
        profiles: get().profiles,
      }),

      importData: (raw) => {
        const { profiles, errors } = parseProfiles(raw);
        if (errors.length || !profiles.length) {
          return errors.length ? errors : ['Aucun profil trouvé dans ce fichier.'];
        }
        set((s) => {
          const taken = new Set(s.profiles.map((p) => p.id));
          const added = profiles.map((p) => (taken.has(p.id) ? { ...p, id: uid() } : p));
          return { profiles: [...s.profiles, ...added], activeId: added[0].id };
        });
        return [];
      },

      resetProfiles: () => {
        const p = firstProfile();
        set({ profiles: [p], activeId: p.id, selected: null, selItem: null });
      },
    }),
    {
      name: 'bjj-game-map:v2',
      version: 2,
      partialize: (s) => ({
        profiles: s.profiles,
        activeId: s.activeId,
        role: s.role,
        mode: s.mode,
        lang: s.lang,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<State> | undefined;
        if (!p?.profiles?.length) return current;
        const activeId = p.profiles.some((x) => x.id === p.activeId) ? p.activeId! : p.profiles[0].id;
        return { ...current, ...p, activeId, selected: null, selItem: null };
      },
    },
  ),
);

export function useActiveProfile(): Profile {
  return useStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? s.profiles[0]);
}

export { otherRole };
