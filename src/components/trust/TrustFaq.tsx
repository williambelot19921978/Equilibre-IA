import { FAQ_ITEMS } from "../../trustCenter";

export function TrustFaq() {
  return (
    <section className="trust-faq" data-testid="trust-faq">
      <h2 className="aura-h2">Centre d&apos;aide</h2>
      <div className="trust-faq-list">
        {FAQ_ITEMS.map((item) => (
          <details key={item.id} className="trust-faq-item aura-glass">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
