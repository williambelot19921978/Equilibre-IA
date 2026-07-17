import type { ChildcareMode } from "../../types/childcare";
import { CHILDCARE_MODE_OPTIONS } from "../../types/childcare";

type ChildcareModeSelectorProps = {
  value: ChildcareMode;
  onChange: (mode: ChildcareMode) => void;
  idPrefix?: string;
};

export function ChildcareModeSelector({
  value,
  onChange,
  idPrefix = "childcare",
}: ChildcareModeSelectorProps) {
  return (
    <fieldset className="childcare-mode-fieldset">
      <legend>Mode de garde pendant les vacances</legend>
      <div className="childcare-mode-options">
        {CHILDCARE_MODE_OPTIONS.map((option) => (
          <label key={option.value} className="childcare-mode-option">
            <input
              type="radio"
              name={`${idPrefix}-mode`}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
