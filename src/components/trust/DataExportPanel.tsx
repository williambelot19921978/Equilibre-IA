import { useState } from "react";

import { Button } from "../ui/Button";
import {
  buildUserDataExport,
  downloadTextFile,
  exportAsCsv,
  exportAsJson,
  exportAsPdfSummary,
} from "../../trustCenter";
import { trackInsightEvent } from "../../auraInsights/eventStore";

type DataExportPanelProps = {
  userId: string;
  date: string;
};

export function DataExportPanel({ userId, date }: DataExportPanelProps) {
  const [busy, setBusy] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  async function handleExport(format: "json" | "csv" | "pdf") {
    setBusy(true);
    try {
      const bundle = await buildUserDataExport(userId, date);
      const stamp = bundle.exportedAt.slice(0, 10);
      if (format === "json") {
        downloadTextFile(`aura-export-${stamp}.json`, exportAsJson(bundle), "application/json");
      } else if (format === "csv") {
        downloadTextFile(`aura-export-${stamp}.csv`, exportAsCsv(bundle), "text/csv");
      } else {
        downloadTextFile(`aura-export-${stamp}.txt`, exportAsPdfSummary(bundle), "text/plain");
      }
      setLastExport(bundle.exportedAt);
      trackInsightEvent(userId, "data_exported", { format });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="trust-export" data-testid="trust-export">
      <h2 className="aura-h2">Exporter mes données</h2>
      <p className="aura-caption">
        Profil, objectifs, historique, check-ins, habitudes et préférences.
      </p>
      <div className="trust-export-actions">
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleExport("json")}>
          JSON
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleExport("csv")}>
          CSV
        </Button>
        <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleExport("pdf")}>
          PDF (résumé)
        </Button>
      </div>
      {lastExport && (
        <p className="aura-caption">Dernier export : {lastExport.slice(0, 16).replace("T", " ")}</p>
      )}
    </section>
  );
}
