import { useEffect } from "react";
import { Link } from "react-router-dom";

import { Card } from "../components/ui/Card";
import { PageContainer } from "../components/ui/PageContainer";
import { SectionHeader } from "../components/ui/SectionHeader";
import {
  APP_VERSION,
  CHANGELOG,
  formatDisplayVersion,
  markChangelogSeen,
  type ChangelogEntryKind,
} from "../release";
import { AppRoutes } from "../lib/navigation/routes";

const KIND_LABELS: Record<ChangelogEntryKind, string> = {
  feature: "Nouveauté",
  fix: "Correction",
  improvement: "Amélioration",
};

const KIND_ICONS: Record<ChangelogEntryKind, string> = {
  feature: "✨",
  fix: "🔧",
  improvement: "💫",
};

function groupByVersion(entries: typeof CHANGELOG): Map<string, typeof CHANGELOG> {
  const map = new Map<string, typeof CHANGELOG>();
  for (const entry of entries) {
    const list = map.get(entry.version) ?? [];
    list.push(entry);
    map.set(entry.version, list);
  }
  return map;
}

export function WhatsNewPage() {
  useEffect(() => {
    markChangelogSeen(APP_VERSION);
  }, []);

  const grouped = groupByVersion(CHANGELOG);

  return (
    <PageContainer>
      <SectionHeader
        label="Quoi de neuf ?"
        title="Les dernières évolutions d'Aura"
        subtitle={`Version actuelle : ${formatDisplayVersion(APP_VERSION)}`}
      />

      <div className="whats-new-list" data-testid="whats-new-page">
        {[...grouped.entries()].map(([version, entries]) => (
          <Card key={version} className="whats-new-version-card aura-glass ds-animate-in">
            <header className="whats-new-version-header">
              <h2>{formatDisplayVersion(version)}</h2>
              <time dateTime={entries[0]?.date}>{entries[0]?.date}</time>
            </header>
            <ul className="whats-new-entries">
              {entries.map((entry) => (
                <li key={entry.id} className={`whats-new-entry whats-new-entry-${entry.kind}`}>
                  <span className="whats-new-kind" aria-hidden="true">
                    {KIND_ICONS[entry.kind]}
                  </span>
                  <div>
                    <p className="whats-new-kind-label">{KIND_LABELS[entry.kind]}</p>
                    <h3>{entry.title}</h3>
                    <p>{entry.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="aura-caption">
        <Link to={AppRoutes.SETTINGS}>Retour aux paramètres</Link>
      </p>
    </PageContainer>
  );
}
