import { useState } from "react";

import { Button } from "../ui/Button";
import {
  FEEDBACK_KIND_LABELS,
  submitFeedback,
  type FeedbackKind,
} from "../../trustCenter";

type BetaFeedbackWidgetProps = {
  userId: string;
  context?: string;
  compact?: boolean;
};

export function BetaFeedbackWidget({ userId, context, compact = false }: BetaFeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("opinion");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(4);
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!message.trim() && kind !== "rating") return;
    submitFeedback(userId, {
      kind,
      message: message.trim() || `Note : ${rating}/5`,
      rating: kind === "rating" ? rating : undefined,
      context,
    });
    setSent(true);
    setMessage("");
    setTimeout(() => {
      setSent(false);
      setOpen(false);
    }, 1800);
  }

  if (compact && !open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="beta-feedback-trigger"
        data-testid="beta-feedback-trigger"
        onClick={() => setOpen(true)}
      >
        Donner mon avis
      </Button>
    );
  }

  return (
    <section className="beta-feedback-widget aura-glass" data-testid="beta-feedback-widget">
      {!open ? (
        <div className="beta-feedback-actions">
          {(Object.keys(FEEDBACK_KIND_LABELS) as FeedbackKind[]).map((item) => (
            <Button key={item} variant="secondary" size="sm" onClick={() => { setKind(item); setOpen(true); }}>
              {FEEDBACK_KIND_LABELS[item]}
            </Button>
          ))}
        </div>
      ) : (
        <div className="beta-feedback-form">
          <h3>{FEEDBACK_KIND_LABELS[kind]}</h3>
          {kind === "rating" && (
            <label>
              Note
              <input
                type="range"
                min={1}
                max={5}
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
              />
              {rating}/5
            </label>
          )}
          <label>
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              placeholder="Votre retour nous aide à améliorer Aura…"
            />
          </label>
          <div className="beta-feedback-form-actions">
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={sent}>
              {sent ? "Merci !" : "Envoyer"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
