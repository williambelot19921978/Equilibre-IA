import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import {
  buildLifeKnowledgeDiagnostics,
  CATEGORY_LABELS,
  confidenceLabel,
  editItem,
  forgetItem,
  getTimelineEvents,
  recordConfirmationChoice,
  type LifeKnowledgeDiagnostics,
  type LifeKnowledgeItem,
  type LifeKnowledgeCategory,
  type LifeKnowledgeSource,
} from "../lifeKnowledgeEngine";
import { isLifeKnowledgeEngineEnabled } from "../config/featureFlags";
import { Button } from "../components/ui/Button";
import { useAppPageTitle } from "../hooks/useAppPageTitle";
import { useAuth } from "../hooks/useAuth";
import { getCurrentDeviceDate } from "../lib/time/deviceClock";
import { AppRoutes } from "../lib/navigation/routes";

const SOURCE_LABELS: Record<LifeKnowledgeSource, string> = {
  settings: "Paramètres",
  observed: "Observé",
  voluntary: "Volontaire",
  goals: "Objectifs",
  user_confirmed: "Confirmé",
};

function KnowledgeItemCard({
  item,
  onForget,
  onIgnore,
  onEdit,
}: {
  readonly item: LifeKnowledgeItem;
  readonly onForget: () => void;
  readonly onIgnore: () => void;
  readonly onEdit: (value: string) => void;
}) {
  return (
    <article className="life-knowledge-item aura-glass" data-testid={`knowledge-item-${item.id}`}>
      <header>
        <h3>{item.label}</h3>
        <p className="life-knowledge-category">{CATEGORY_LABELS[item.category]}</p>
      </header>
      <p>{item.value}</p>
      <ul className="life-knowledge-meta">
        <li>Origine : {SOURCE_LABELS[item.source] ?? item.source}</li>
        <li>Confiance : {confidenceLabel(item.confidence)}</li>
        <li>Dernière modification : {item.updatedAt.slice(0, 16).replace("T", " ")}</li>
        {item.lastVerifiedAt && (
          <li>Vérifié : {item.lastVerifiedAt.slice(0, 10)}</li>
        )}
      </ul>
      {item.evidence && item.evidence.length > 0 && (
        <p className="life-knowledge-history">Historique : {item.evidence.join(" · ")}</p>
      )}
      <div className="life-knowledge-item-actions">
        <Button variant="secondary" size="sm" onClick={() => onEdit(prompt("Nouvelle valeur", item.value) ?? item.value)}>
          Modifier
        </Button>
        <Button variant="ghost" size="sm" onClick={onIgnore}>
          Ignorer
        </Button>
        <Button variant="ghost" size="sm" onClick={onForget}>
          Supprimer
        </Button>
      </div>
    </article>
  );
}

export function LifeKnowledgePage() {
  useAppPageTitle("Ce qu'Aura sait de moi");
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<LifeKnowledgeDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LifeKnowledgeCategory | "all">("all");
  const [sourceFilter, setSourceFilter] = useState<LifeKnowledgeSource | "all">("all");

  const reload = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await buildLifeKnowledgeDiagnostics({
      userId: user.id,
      date: getCurrentDeviceDate(),
    });
    setDiagnostics(result);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!isLifeKnowledgeEngineEnabled() || !user?.id) {
      setLoading(false);
      return;
    }
    void reload();
  }, [reload, user?.id]);

  const filteredItems = useMemo(() => {
    if (!diagnostics) return [];
    const query = search.trim().toLowerCase();
    return diagnostics.visibleItems.filter((item) => {
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
      if (!query) return true;
      return (
        item.label.toLowerCase().includes(query) ||
        item.value.toLowerCase().includes(query)
      );
    });
  }, [diagnostics, search, categoryFilter, sourceFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, LifeKnowledgeItem[]>();
    for (const item of filteredItems) {
      const key = CATEGORY_LABELS[item.category];
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return map;
  }, [filteredItems]);

  const timeline = user?.id ? getTimelineEvents(user.id) : [];

  function handleForget(id: string) {
    if (!user?.id) return;
    forgetItem(user.id, id);
    void reload();
  }

  function handleIgnore(id: string) {
    if (!user?.id) return;
    forgetItem(user.id, id);
    void reload();
  }

  function handleEdit(id: string, value: string) {
    if (!user?.id) return;
    editItem(user.id, id, { value });
    void reload();
  }

  function handleConfirmation(proposalId: string, choice: "yes" | "no" | "later" | "never") {
    if (!user?.id) return;
    recordConfirmationChoice(user.id, proposalId, choice);
    void reload();
  }

  if (!isLifeKnowledgeEngineEnabled()) {
    return <Navigate to={AppRoutes.HOME} replace />;
  }

  return (
    <main className="life-knowledge-page" data-testid="life-knowledge-page">
      <header className="planning-engine-diagnostics-header">
        <p className="planning-engine-diagnostics-eyebrow">Confiance</p>
        <h1>Ce qu&apos;Aura sait de moi</h1>
        <p>Transparence totale — chaque connaissance est explicable, modifiable et supprimable.</p>
        <p className="aura-caption">
          <Link to={AppRoutes.TRUST_CENTER}>Centre Confiance &amp; Confidentialité</Link>
        </p>
      </header>

      <div className="life-knowledge-toolbar">
        <input
          type="search"
          placeholder="Rechercher…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          data-testid="knowledge-search"
          aria-label="Rechercher une connaissance"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as LifeKnowledgeCategory | "all")}
          aria-label="Filtrer par catégorie"
        >
          <option value="all">Toutes catégories</option>
          {(Object.keys(CATEGORY_LABELS) as LifeKnowledgeCategory[]).map((key) => (
            <option key={key} value={key}>
              {CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as LifeKnowledgeSource | "all")}
          aria-label="Filtrer par origine"
        >
          <option value="all">Toutes origines</option>
          {(Object.keys(SOURCE_LABELS) as LifeKnowledgeSource[]).map((key) => (
            <option key={key} value={key}>
              {SOURCE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Chargement…</p>}

      {diagnostics && !loading && (
        <>
          <section className="life-knowledge-summary aura-glass">
            <p>{diagnostics.knowledgeCount} connaissance(s) — {diagnostics.confirmedCount} confirmée(s)</p>
            <p>Confiance moyenne : {confidenceLabel(diagnostics.averageConfidence)}</p>
            <p>{filteredItems.length} affichée(s) après filtres</p>
          </section>

          {diagnostics.pendingConfirmations.length > 0 && (
            <section data-testid="knowledge-confirmations">
              <h2>Confirmations proposées</h2>
              {diagnostics.pendingConfirmations.map((proposal) => (
                <article key={proposal.id} className="life-knowledge-confirmation aura-glass">
                  <p>{proposal.message}</p>
                  <p>Confiance : {confidenceLabel(proposal.confidence)}</p>
                  <div className="life-knowledge-item-actions">
                    <Button variant="primary" size="sm" onClick={() => handleConfirmation(proposal.id, "yes")}>
                      Oui
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleConfirmation(proposal.id, "no")}>
                      Non
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleConfirmation(proposal.id, "later")}>
                      Plus tard
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleConfirmation(proposal.id, "never")}>
                      Jamais
                    </Button>
                  </div>
                </article>
              ))}
            </section>
          )}

          {[...grouped.entries()].map(([category, items]) => (
            <section key={category} data-testid={`knowledge-section-${category}`}>
              <h2>{category}</h2>
              {items.map((item) => (
                <KnowledgeItemCard
                  key={item.id}
                  item={item}
                  onForget={() => handleForget(item.id)}
                  onIgnore={() => handleIgnore(item.id)}
                  onEdit={(value) => handleEdit(item.id, value)}
                />
              ))}
            </section>
          ))}

          {filteredItems.length === 0 && (
            <p>Aucune connaissance ne correspond à votre recherche.</p>
          )}

          {timeline.length > 0 && (
            <section data-testid="knowledge-timeline">
              <h2>Historique des changements</h2>
              <ul>
                {timeline.map((event) => (
                  <li key={event.id}>
                    {event.date} — {event.title} : {event.description}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
