import { useState } from "react";

import { Button } from "../ui/Button";
import {
  getPrivacyPreferences,
  PRIVACY_PREFERENCE_LABELS,
  setPrivacyPreference,
  type PrivacyPreferenceKey,
} from "../../trustCenter";

type PrivacyPreferencesPanelProps = {
  userId: string;
};

export function PrivacyPreferencesPanel({ userId }: PrivacyPreferencesPanelProps) {
  const [prefs, setPrefs] = useState(() => getPrivacyPreferences(userId));

  function toggle(key: PrivacyPreferenceKey) {
    const next = setPrivacyPreference(userId, key, !prefs[key]);
    setPrefs(next);
  }

  return (
    <section className="trust-privacy-prefs" data-testid="trust-privacy-prefs">
      <h2 className="aura-h2">Confidentialité</h2>
      <p className="aura-caption">Chaque option est modifiable à tout moment.</p>
      <ul className="trust-toggle-list">
        {(Object.keys(PRIVACY_PREFERENCE_LABELS) as PrivacyPreferenceKey[]).map((key) => {
          const meta = PRIVACY_PREFERENCE_LABELS[key];
          return (
            <li key={key} className="trust-toggle-row aura-glass">
              <div>
                <strong>{meta.label}</strong>
                <p>{meta.description}</p>
              </div>
              <Button
                variant={prefs[key] ? "primary" : "secondary"}
                size="sm"
                onClick={() => toggle(key)}
                data-testid={`privacy-pref-${key}`}
                aria-pressed={prefs[key]}
              >
                {prefs[key] ? "Oui" : "Non"}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
