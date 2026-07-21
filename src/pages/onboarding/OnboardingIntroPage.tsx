import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { OnboardingLayout } from "../../components/onboarding/OnboardingLayout";
import { useAppNavigation } from "../../hooks/useAppNavigation";
import { AppRoutes } from "../../lib/navigation/routes";

const HIGHLIGHTS = [
  {
    icon: "📋",
    title: "Planning intelligent",
    text: "Visualise ta journée et ajuste-la facilement.",
  },
  {
    icon: "💬",
    title: "Assistant bienveillant",
    text: "Pose tes questions, reçois des conseils adaptés.",
  },
  {
    icon: "🎯",
    title: "Objectifs clairs",
    text: "Avance pas à pas vers ce qui compte pour toi.",
  },
];

export function OnboardingIntroPage() {
  const { advanceOnboardingStep } = useAppNavigation();

  function handleContinue() {
    void advanceOnboardingStep({ introSeen: true }, AppRoutes.HOUSEHOLD);
  }

  return (
    <OnboardingLayout
      title="Aura en bref"
      subtitle="Un compagnon pour mieux vivre ton quotidien — sans surcharge."
      showProgress={false}
    >
      <ul className="onboarding-highlights">
        {HIGHLIGHTS.map((item) => (
          <li key={item.title}>
            <Card variant="ghost">
              <span aria-hidden="true">{item.icon}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <Button fullWidth onClick={handleContinue} data-testid="onboarding-intro-continue">
        Créer mon espace
      </Button>
    </OnboardingLayout>
  );
}
