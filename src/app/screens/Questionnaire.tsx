import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  ButtonGroup,
  SelectField,
  SelectItem,
  SliderField,
  SwitchField,
  Text,
  TextContentTitle,
  TextHeading,
  TextSmall,
} from "primitives";
import { ORIGINS } from "../../data/origins";
import {
  COMPOSITIONS,
  DEALBREAKERS,
  INTERESTS,
  VIBES,
  type Composition,
  type Dealbreaker,
  type DisplayCurrency,
  type Interest,
  type TripInputs,
  type Vibe,
} from "../../engine/types";
import { useSession } from "../../state/SessionContext";
import { validateInputs } from "../../state/validation";
import { ChipGroup, LabeledField, Stepper, type ChipOption } from "../components/controls";
import { useDocumentTitle } from "../hooks";

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const vibeOptions: ChipOption[] = VIBES.map((v) => ({ key: v, label: titleCase(v) }));
const interestOptions: ChipOption[] = INTERESTS.map((v) => ({ key: v, label: titleCase(v) }));
const dealbreakerOptions: ChipOption[] = DEALBREAKERS.map((v) => ({ key: v, label: titleCase(v) }));
const compositionOptions: ChipOption[] = COMPOSITIONS.map((v) => ({ key: v, label: titleCase(v) }));

type ValidationErrors = ReturnType<typeof validateInputs>["errors"];

type StepDef = {
  title: string;
  errorKey?: keyof ValidationErrors;
  render: () => JSX.Element;
};

export function Questionnaire() {
  const { inputs, setInputs, run } = useSession();
  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("Plan your spin");

  const validation = validateInputs(inputs);
  const showErrors = attempted;

  const update = (patch: Partial<TripInputs>) => setInputs({ ...inputs, ...patch });

  const moneyFmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: inputs.budget.currency,
    maximumFractionDigits: 0,
  });

  const datesField = (
    <LabeledField
      label="Travel dates"
      error={showErrors ? validation.errors.dates : undefined}
      hint="When do you want to travel?"
    >
      <div className="vr-row">
        <input
          className="input"
          type="date"
          aria-label="Start date"
          value={inputs.dates.start}
          onChange={(e) => update({ dates: { ...inputs.dates, start: e.target.value } })}
        />
        <input
          className="input"
          type="date"
          aria-label="End date"
          value={inputs.dates.end}
          onChange={(e) => update({ dates: { ...inputs.dates, end: e.target.value } })}
        />
      </div>
      <div className="vr-row" style={{ marginTop: "var(--sds-size-space-150)" }}>
        <SwitchField
          isSelected={inputs.dates.flexDays > 0}
          onChange={(on) => update({ dates: { ...inputs.dates, flexDays: on ? 3 : 0 } })}
        >
          Flexible dates
        </SwitchField>
        {inputs.dates.flexDays > 0 && (
          <SelectField
            aria-label="Flexible by how many days"
            selectedKey={String(inputs.dates.flexDays)}
            onSelectionChange={(k) =>
              update({ dates: { ...inputs.dates, flexDays: Number(k) } })
            }
          >
            {[1, 3, 5, 7].map((d) => (
              <SelectItem key={d} id={String(d)}>{`± ${d} days`}</SelectItem>
            ))}
          </SelectField>
        )}
      </div>
    </LabeledField>
  );

  const originField = (
    <LabeledField label="Leaving from" error={showErrors ? validation.errors.origin : undefined}>
      <SelectField
        aria-label="Origin airport"
        items={ORIGINS}
        selectedKey={inputs.origin.iata}
        onSelectionChange={(key) => {
          const o = ORIGINS.find((x) => x.iata === key);
          if (o) update({ origin: { city: o.city, iata: o.iata } });
        }}
      >
        {(o) => (
          <SelectItem id={o.iata}>{`${o.city} (${o.iata})`}</SelectItem>
        )}
      </SelectField>
    </LabeledField>
  );

  const partySizeField = (
    <LabeledField label="Party size" error={showErrors ? validation.errors.partySize : undefined}>
      <Stepper
        ariaLabel="Party size"
        value={inputs.partySize}
        min={1}
        max={12}
        onChange={(n) => update({ partySize: n })}
      />
    </LabeledField>
  );

  const compositionField = (
    <LabeledField label="Who's going?">
      <ChipGroup
        label="Trip composition"
        mode="single"
        options={compositionOptions}
        value={[inputs.composition]}
        onChange={(v) => v[0] && update({ composition: v[0] as Composition })}
      />
    </LabeledField>
  );

  const vibeField = (
    <LabeledField label="Vibe" hint="Pick as many as you like.">
      <ChipGroup
        label="Vibe"
        options={vibeOptions}
        value={inputs.vibe}
        onChange={(v) => update({ vibe: v as Vibe[] })}
      />
    </LabeledField>
  );

  const budgetField = (
    <LabeledField label={`Budget — ${moneyFmt.format(inputs.budget.amount)}`} error={showErrors ? validation.errors.budget : undefined}>
      <SliderField
        aria-label="Budget amount"
        minValue={500}
        maxValue={15000}
        step={250}
        value={inputs.budget.amount}
        onChange={(v) => update({ budget: { ...inputs.budget, amount: Number(v) } })}
      />
      <div className="vr-row" style={{ marginTop: "var(--sds-size-space-150)" }}>
        <ChipGroup
          label="Budget basis"
          mode="single"
          options={[
            { key: "total", label: "Total" },
            { key: "per_person", label: "Per person" },
          ]}
          value={[inputs.budget.basis]}
          onChange={(v) => v[0] && update({ budget: { ...inputs.budget, basis: v[0] as "total" | "per_person" } })}
        />
        <ChipGroup
          label="Budget covers"
          mode="single"
          options={[
            { key: "flights_lodging", label: "Flights + lodging" },
            { key: "on_ground", label: "On-the-ground only" },
          ]}
          value={[inputs.budget.covers]}
          onChange={(v) => v[0] && update({ budget: { ...inputs.budget, covers: v[0] as "flights_lodging" | "on_ground" } })}
        />
        <SelectField
          aria-label="Display currency"
          selectedKey={inputs.budget.currency}
          onSelectionChange={(k) => update({ budget: { ...inputs.budget, currency: k as DisplayCurrency } })}
        >
          {(["USD", "EUR", "GBP"] as DisplayCurrency[]).map((c) => (
            <SelectItem key={c} id={c}>{c}</SelectItem>
          ))}
        </SelectField>
      </div>
    </LabeledField>
  );

  const interestsField = (
    <LabeledField label="Must-haves" hint="Anything the trip needs to have.">
      <ChipGroup
        label="Interests"
        options={interestOptions}
        value={inputs.interests}
        onChange={(v) => update({ interests: v as Interest[] })}
      />
    </LabeledField>
  );

  const dealbreakersField = (
    <LabeledField label="Dealbreakers" hint="Hard nos we'll filter out.">
      <ChipGroup
        label="Dealbreakers"
        options={dealbreakerOptions}
        value={inputs.dealbreakers}
        onChange={(v) => update({ dealbreakers: v as Dealbreaker[] })}
      />
    </LabeledField>
  );

  const reachField = (
    <LabeledField
      label={`How far? — max ${inputs.reach.maxFlightHours}h`}
      error={showErrors ? validation.errors.reach : undefined}
      hint={validation.warnings.reach}
    >
      <ChipGroup
        label="Reach"
        mode="single"
        options={[
          { key: "dom", label: "Domestic" },
          { key: "intl", label: "International" },
        ]}
        value={[inputs.reach.international ? "intl" : "dom"]}
        onChange={(v) =>
          update({ reach: { ...inputs.reach, international: v[0] === "intl" } })
        }
      />
      <SliderField
        aria-label="Maximum flight time in hours"
        minValue={1}
        maxValue={24}
        step={1}
        value={inputs.reach.maxFlightHours}
        onChange={(v) => update({ reach: { ...inputs.reach, maxFlightHours: Number(v) } })}
      />
    </LabeledField>
  );

  const steps: StepDef[] = [
    { title: "When do you want to travel?", errorKey: "dates", render: () => datesField },
    { title: "Where are you leaving from?", errorKey: "origin", render: () => originField },
    { title: "How many travelers?", errorKey: "partySize", render: () => partySizeField },
    { title: "Who's going?", render: () => compositionField },
    { title: "What's the vibe?", render: () => vibeField },
    { title: "What's your budget?", errorKey: "budget", render: () => budgetField },
    { title: "Any must-haves?", render: () => interestsField },
    { title: "Any dealbreakers?", render: () => dealbreakersField },
    { title: "How far will you go?", errorKey: "reach", render: () => reachField },
  ];

  const total = steps.length;
  const current = steps[step - 1];
  const isLast = step === total;

  const goNext = () => {
    setAttempted(true);
    if (current.errorKey && validation.errors[current.errorKey]) return;
    setAttempted(false);
    setStep((s) => Math.min(total, s + 1));
  };

  const goBack = () => {
    setAttempted(false);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = () => {
    setAttempted(true);
    if (current.errorKey && validation.errors[current.errorKey]) return;
    if (!validation.valid) return;
    run();
    navigate("/spin");
  };

  return (
    <div className="vr-container vr-stack" style={{ paddingBlock: "var(--sds-size-space-800)" }}>
      <TextContentTitle title="Plan your spin" subtitle="9 quick questions · about a minute" />

      <div className="vr-wizard vr-stack">
        <div className="vr-row" style={{ justifyContent: "space-between" }}>
          <TextSmall className="vr-muted">{`Step ${step} of ${total}`}</TextSmall>
        </div>
        <div className="vr-progress" aria-hidden="true">
          <div className="vr-progress-fill" style={{ width: `${(step / total) * 100}%` }} />
        </div>

        <div className="vr-stack">
          <TextHeading elementType="h2">{current.title}</TextHeading>
          {current.render()}
        </div>

        {showErrors && current.errorKey && validation.errors[current.errorKey] && (
          <Text style={{ color: "var(--sds-color-text-danger-default)" }}>
            Please fix the highlighted field to continue.
          </Text>
        )}

        <hr className="vr-divider" />

        <ButtonGroup align="justify">
          {step === 1 ? (
            <Button variant="neutral" href="/#/">
              Back
            </Button>
          ) : (
            <Button variant="neutral" onPress={goBack}>
              Back
            </Button>
          )}
          {isLast ? (
            <Button variant="primary" onPress={submit}>
              See my picks
            </Button>
          ) : (
            <Button variant="primary" onPress={goNext}>
              Next
            </Button>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
}
