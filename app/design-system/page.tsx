import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ModalDemo } from "@/components/design-system/modal-demo";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  Input,
  Tabs,
  Textarea,
} from "@/components/ui";

export const metadata: Metadata = { title: "Design system · web-app" };

const swatches = [
  {
    name: "cream-100",
    hex: "#F7F5F2",
    dark: "#1A1814",
    className: "bg-cream-100",
  },
  {
    name: "cream-50",
    hex: "#FAF9F5",
    dark: "#232019",
    className: "bg-cream-50",
  },
  {
    name: "cream-200",
    hex: "#EFEBE4",
    dark: "#2D2A23",
    className: "bg-cream-200",
  },
  { name: "line", hex: "#E5E0D8", dark: "#38342C", className: "bg-line" },
  {
    name: "clay-500",
    hex: "#D97757",
    dark: "#D97757",
    className: "bg-clay-500",
  },
  {
    name: "clay-700",
    hex: "#A94A2B",
    dark: "#F2A98D",
    className: "bg-clay-700",
  },
  {
    name: "ink-muted",
    hex: "#6B665E",
    dark: "#A59E91",
    className: "bg-ink-muted",
  },
  { name: "ink", hex: "#1A1A1A", dark: "#F3EFE8", className: "bg-ink" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-line border-t pt-10">
      <h2 className="font-display text-3xl font-medium tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-ink-muted mt-2 max-w-prose">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-14">
      <header>
        <h1 className="font-display text-5xl leading-[1.1] font-medium tracking-tight text-balance sm:text-6xl">
          A calm place to build
        </h1>
        <p className="text-ink-muted mt-5 max-w-xl text-lg leading-relaxed">
          Every primitive in the app, in every variant. Use this page to review
          the look before building features on top of it.
        </p>
      </header>

      <Section
        title="Color"
        description="Warm neutrals for surfaces, one clay accent for the things that matter. Each swatch shows light / dark; use the toggle in the nav to switch."
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {swatches.map((s) => (
            <li key={s.name}>
              <div
                className={`border-line h-16 rounded-xl border ${s.className}`}
              />
              <p className="mt-2 text-sm font-medium">{s.name}</p>
              <p className="text-ink-muted text-xs">
                {s.hex} <span aria-hidden="true">/</span> {s.dark}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Type"
        description="Fraunces for headings, Inter for everything you read or click."
      >
        <div className="flex flex-col gap-3">
          <p className="font-display text-5xl font-medium tracking-tight">
            Heading one
          </p>
          <p className="font-display text-3xl font-medium tracking-tight">
            Heading two
          </p>
          <p className="font-display text-xl font-medium">Heading three</p>
          <p className="text-ink-soft max-w-prose leading-relaxed">
            Body text is set in Inter at a comfortable measure, with generous
            line height so longer passages stay easy to read.
          </p>
          <p className="text-ink-muted text-sm">
            Secondary text, for hints and supporting details.
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Save changes</Button>
            <Button variant="secondary">Cancel</Button>
            <Button variant="ghost">Skip for now</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardTitle>Primary</CardTitle>
            <CardDescription>
              Raised surface with a thin border and a soft shadow.
            </CardDescription>
          </Card>
          <Card variant="secondary">
            <CardTitle>Secondary</CardTitle>
            <CardDescription>
              Flat, tinted surface for grouping quietly.
            </CardDescription>
          </Card>
          <Card variant="ghost" interactive tabIndex={0}>
            <CardTitle>Interactive</CardTitle>
            <CardDescription>Lifts slightly on hover.</CardDescription>
          </Card>
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            label="Name"
            placeholder="Ada Lovelace"
            hint="Shown on your profile."
          />
          <Input
            label="Email"
            type="email"
            defaultValue="ada@"
            error="Enter a full email address, like ada@example.com."
          />
          <Textarea
            className="sm:col-span-2"
            label="Notes"
            placeholder="Anything worth remembering…"
          />
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Checkbox
              label="Email me a weekly summary"
              description="Sent on Monday mornings."
              defaultChecked
            />
            <Checkbox label="Share my profile publicly" />
            <Checkbox label="Disabled option" disabled />
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">New</Badge>
          <Badge variant="secondary">Draft</Badge>
          <Badge variant="ghost">Archived</Badge>
        </div>
      </Section>

      <Section
        title="Tabs"
        description="Arrow keys, Home and End move between tabs."
      >
        <div className="flex flex-col gap-10">
          {(["primary", "secondary", "ghost"] as const).map((variant) => (
            <Tabs
              key={variant}
              variant={variant}
              items={[
                {
                  value: "overview",
                  label: "Overview",
                  content: `The ${variant} tabs show a summary of what's here.`,
                },
                {
                  value: "activity",
                  label: "Activity",
                  content: "Recent changes appear here.",
                },
                {
                  value: "settings",
                  label: "Settings",
                  content: "Adjust how this behaves.",
                },
              ]}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Modal"
        description="Focus is trapped inside, Escape or a click outside closes it."
      >
        <ModalDemo />
      </Section>
    </div>
  );
}
