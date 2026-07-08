import { useDealDeskApp } from "./useDealDeskApp";

export type JourneyStep = { key: string; label: string; done: boolean };
export type NextStep = { key: string; title: string; description: string; cta: string; route: string };

// Derives the guided-journey state purely from app state, so the Home stepper and
// "your next step" card always reflect real progress.
export function useJourney(): { steps: JourneyStep[]; nextStep: NextStep; activeKey: string; completedCount: number } {
  const { activeSearch, dealers, vehicles, offers, interactions } = useDealDeskApp();

  const hasSearch = Boolean(activeSearch);
  const hasDealers = dealers.length > 0;
  const hasCars = vehicles.length > 0;
  const hasOutreach = interactions.length > 0 || dealers.some((dealer) => dealer.status !== "not_contacted");
  const hasOffers = offers.length > 0;

  const steps: JourneyStep[] = [
    { key: "search", label: "Search", done: hasSearch },
    { key: "dealers", label: "Dealers", done: hasDealers },
    { key: "cars", label: "Cars", done: hasCars },
    { key: "outreach", label: "Outreach", done: hasOutreach },
    { key: "compare", label: "Compare", done: hasOffers }
  ];

  const nextByKey: Record<string, NextStep> = {
    search: { key: "search", title: "Set up your car search", description: "Tell DealDesk the vehicle you want and where you're shopping.", cta: "Create search", route: "/search-setup" },
    dealers: { key: "dealers", title: "Add dealers to contact", description: "Find nearby dealers that carry your vehicle.", cta: "Find dealers", route: "/dealers" },
    cars: { key: "cars", title: "Capture a specific car", description: "Open a dealer and add a car by pasting a link or a screenshot.", cta: "Go to dealers", route: "/dealers" },
    outreach: { key: "outreach", title: "Send your first outreach", description: "Generate an AI message and mark dealers contacted.", cta: "Start outreach", route: "/outreach" },
    compare: { key: "compare", title: "Log a dealer quote", description: "Add a quote so DealDesk can rank offers by out-the-door price.", cta: "Add a quote", route: "/ai" }
  };

  const firstIncomplete = steps.find((step) => !step.done);
  const nextStep: NextStep = firstIncomplete
    ? nextByKey[firstIncomplete.key]
    : { key: "done", title: "You're all set", description: "Compare offers and negotiate the best out-the-door price.", cta: "Compare offers", route: "/offers" };

  return {
    steps,
    nextStep,
    activeKey: firstIncomplete?.key ?? "compare",
    completedCount: steps.filter((step) => step.done).length
  };
}
