import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AiBadge } from "../components/AiBadge";
import { AiOutputCard, FieldRow } from "../components/AiOutputCard";
import { Button } from "../components/Button";
import { DataTable } from "../components/DataTable";
import { GeneratingBlock } from "../components/GeneratingBlock";
import { InsightCard } from "../components/InsightCard";
import { InsightPanel } from "../components/InsightPanel";
import { Reveal } from "../components/Reveal";
import { RichList, RichListRow } from "../components/RichList";
import { Section } from "../components/Section";
import { ShimmerLine } from "../components/ShimmerLine";
import { TypewriterText } from "../components/TypewriterText";
import { WorkflowFlow } from "../components/WorkflowFlow";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useJourney } from "../hooks/useJourney";

// Controllable window width for the breakpoint hook.
const dims = vi.hoisted(() => ({ width: 0 }));
vi.mock("react-native", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, useWindowDimensions: () => ({ width: dims.width, height: 800, scale: 1, fontScale: 1 }) };
});

vi.mock("expo-linear-gradient", () => ({ LinearGradient: (props: { children?: unknown }) => props.children ?? null }));
vi.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
vi.mock("react-native-svg", () => ({
  default: (props: { children?: unknown }) => props.children ?? null,
  Svg: (props: { children?: unknown }) => props.children ?? null,
  Path: () => null,
  Defs: (props: { children?: unknown }) => props.children ?? null,
  LinearGradient: (props: { children?: unknown }) => props.children ?? null,
  Stop: () => null
}));

vi.mock("../hooks/useDealDeskApp", () => ({ useDealDeskApp: vi.fn() }));
import { useDealDeskApp } from "../hooks/useDealDeskApp";

function BreakpointProbe() {
  const { isWide, columns } = useBreakpoint();
  return <Text>{`${isWide}:${columns}`}</Text>;
}

function JourneyProbe() {
  const { nextStep, completedCount } = useJourney();
  return <Text>{`${nextStep.key}:${completedCount}`}</Text>;
}

describe("useBreakpoint", () => {
  it("is mobile (1 column, not wide) when width is unknown", () => {
    dims.width = 0;
    render(<BreakpointProbe />);
    expect(screen.getByText("false:1")).toBeTruthy();
  });

  it("is wide with 3 columns on a desktop width", () => {
    dims.width = 1400;
    render(<BreakpointProbe />);
    expect(screen.getByText("true:3")).toBeTruthy();
  });
});

describe("useJourney", () => {
  const base = { activeSearch: null, dealers: [], vehicles: [], offers: [], interactions: [] };

  beforeEach(() => vi.mocked(useDealDeskApp).mockReset());

  it("points to creating a search first when nothing exists", () => {
    vi.mocked(useDealDeskApp).mockReturnValue(base as never);
    render(<JourneyProbe />);
    expect(screen.getByText("search:0")).toBeTruthy();
  });

  it("advances to the dealers step once a search exists", () => {
    vi.mocked(useDealDeskApp).mockReturnValue({ ...base, activeSearch: { _id: "s1" } } as never);
    render(<JourneyProbe />);
    expect(screen.getByText("dealers:1")).toBeTruthy();
  });

  it("is complete when every stage has data", () => {
    vi.mocked(useDealDeskApp).mockReturnValue({
      activeSearch: { _id: "s1" },
      dealers: [{ _id: "d1", status: "contacted" }],
      vehicles: [{ _id: "v1" }],
      offers: [{ _id: "o1" }],
      interactions: [{ _id: "i1" }]
    } as never);
    render(<JourneyProbe />);
    expect(screen.getByText("done:5")).toBeTruthy();
  });
});

describe("Button", () => {
  it("renders its label and fires onPress", () => {
    const onPress = vi.fn();
    render(<Button label="Do it" onPress={onPress} />);
    fireEvent.press(screen.getByText("Do it"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("AiBadge", () => {
  it("renders its label", () => {
    render(<AiBadge label="AI-powered" />);
    expect(screen.getByText("AI-powered")).toBeTruthy();
  });
});

describe("AI-moment primitives", () => {
  it("Reveal keeps its children in the tree", () => {
    render(<Reveal><Text>revealed content</Text></Reveal>);
    expect(screen.getByText("revealed content")).toBeTruthy();
  });

  it("ShimmerLine renders without error", () => {
    render(<View><ShimmerLine /><Text>after shimmer</Text></View>);
    expect(screen.getByText("after shimmer")).toBeTruthy();
  });

  it("AiOutputCard renders its title and field rows", () => {
    render(
      <AiOutputCard title="Parsed listing" confidence="high">
        <FieldRow label="VIN" value="JTHGP8CA5N1234567" />
      </AiOutputCard>
    );
    expect(screen.getByText("Parsed listing")).toBeTruthy();
    expect(screen.getByText("VIN")).toBeTruthy();
    expect(screen.getByText("JTHGP8CA5N1234567")).toBeTruthy();
  });

  it("TypewriterText shows the full text when reduced/instant", () => {
    render(<TypewriterText text="Drafting a reply" instant />);
    expect(screen.getByText("Drafting a reply")).toBeTruthy();
  });

  it("InsightCard renders its insight text", () => {
    render(<InsightCard>Ask the other dealers to beat it.</InsightCard>);
    expect(screen.getByText("Ask the other dealers to beat it.")).toBeTruthy();
  });

  it("GeneratingBlock renders its status message", () => {
    render(<GeneratingBlock messages={["Extracting VIN, trim, and dealer info…"]} />);
    expect(screen.getByText("Extracting VIN, trim, and dealer info…")).toBeTruthy();
  });

  it("WorkflowFlow renders each connected step (svg mocked)", () => {
    render(<WorkflowFlow steps={[
      { n: 1, title: "Search", desc: "You tell DealDesk the car." },
      { n: 2, title: "Capture cars", desc: "AI fills in the details.", ai: true }
    ]} />);
    expect(screen.getByText("Search")).toBeTruthy();
    expect(screen.getByText("Capture cars")).toBeTruthy();
  });
});

describe("layout primitives", () => {
  it("Section renders its heading and children", () => {
    render(<Section title="Cars"><Text>captured car row</Text></Section>);
    expect(screen.getByText("Cars")).toBeTruthy();
    expect(screen.getByText("captured car row")).toBeTruthy();
  });

  it("InsightPanel renders its title and body", () => {
    render(<InsightPanel title="Quick actions"><Text>panel body</Text></InsightPanel>);
    expect(screen.getByText("Quick actions")).toBeTruthy();
    expect(screen.getByText("panel body")).toBeTruthy();
  });

  it("RichListRow shows its content and toggles via the select region", () => {
    const onPress = vi.fn();
    render(
      <RichList>
        <RichListRow onPress={onPress} accessibilityLabel="Select Lexus of Portland">
          <Text>Lexus of Portland</Text>
        </RichListRow>
      </RichList>
    );
    expect(screen.getByText("Lexus of Portland")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Select Lexus of Portland"));
    expect(onPress).toHaveBeenCalled();
  });

  it("DataTable renders column headers and cell values", () => {
    render(
      <DataTable
        columns={[{ key: "dealer", label: "Dealer" }, { key: "otd", label: "OTD" }]}
        rows={[{ dealer: "Portland", otd: "$61,000" }]}
        rowKey={(row) => row.dealer as string}
      />
    );
    expect(screen.getByText("Dealer")).toBeTruthy();
    expect(screen.getByText("Portland")).toBeTruthy();
    expect(screen.getByText("$61,000")).toBeTruthy();
  });
});
