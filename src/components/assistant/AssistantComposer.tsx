import { useState, type FormEvent } from "react";

import { Button } from "../ui/Button";

type AssistantComposerProps = {
  disabled?: boolean;
  onSend: (message: string) => void | Promise<unknown>;
};

export function AssistantComposer({ disabled = false, onSend }: AssistantComposerProps) {
  const [value, setValue] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    await onSend(trimmed);
  }

  return (
    <form className="assistant-composer" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="assistant-message-input">
        Message à l&apos;assistant
      </label>
      <textarea
        id="assistant-message-input"
        className="assistant-composer-input"
        rows={3}
        placeholder="Ex. Je suis fatigué, comment organiser ma fin de journée ?"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="assistant-composer-actions">
        <Button type="submit" disabled={disabled || !value.trim()}>
          Envoyer
        </Button>
      </div>
    </form>
  );
}
