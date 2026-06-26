import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "hooks";
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

const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const vibeOptions: ChipOption[] = VIBES.map((v) => ({ key: v, label: titleCase(v) }));
const interestOptions: ChipOption[] = INTERESTS.map((v) => ({ key: v, label: titleCase(v) }));
const dealbreakerOptions: ChipOption[] = DEALBREAKERS.map((v) => ({ key: v, label: titleCase(v) }));
const compositionOptions: ChipOption[] = COMPOSITIONS.map((v) => ({ key: v, label: titleCase(v) }));

export function Questionnaire() {
  const { inputs, setInputs, run } = useSession();
  const { isMobile } = useMediaQuery();
  const [step, setStep] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const navigate = useNavigate();

  const validation = validateInputs(inputs);
  const showErrors = attempted;

  const update = (patch: Partial<TripInputs>) => setInputs({ ...inputs, ...patch });

  const moneyFmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: inputs.budget.currency,
    maximumFractionDigits: 0,
  });

  const submit = () => {
    setAttempted(true);
    if (!validation.valid) return;
    run();
    navigate("/spin");
  };

  const goNext = () => {
    setAttempted(true);
    // Step 1 only needs date/origin/party validity to proceed.
    if (validation.errors.dates || validation.errors.origin || validation.errors.partySize) return;
    setAttempted(false);
    setStep(2);
  };

  const whenWhere = (
    <div className="vr-stack">
      <TextHeading>When & where?</TextHeading>

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

      <LabeledField label="Party size" error={showErrors ? validation.errors.partySize : undefined}>
        <Stepper
          ariaLabel="Party size"
          value={inputs.partySize}
          min={1}
          max={12}
          onChange={(n) => update({ partySize: n })}
        />
      </LabeledField>

      <LabeledField label="Who's going?">
        <ChipGroup
          label="Trip composition"
          mode="single"
          options={compositionOptions}
          value={[inputs.composition]}
          onChange={(v) => v[0] && update({ composition: v[0] as Composition })}
        />
      </LabeledField>
    </div>
  );

  const vibeBudget = (
    <div className="vr-stack">
      <TextHeading>What's the vibe?</TextHeading>

      <LabeledField label="Vibe" hint="Pick as many as you like.">
        <ChipGroup
          label="Vibe"
          options={vibeOptions}
          value={inputs.vibe}
          onChange={(v) => update({ vibe: v as Vibe[] })}
        />
      </LabeledField>

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

      <LabeledField label="Must-haves" hint="Anything the trip needs to have.">
        <ChipGroup
          label="Interests"
          options={interestOptions}
          value={inputs.interests}
          onChange={(v) => update({ interests: v as Interest[] })}
        />
      </LabeledField>

      <LabeledField label="Dealbreakers" hint="Hard nos we'll filter out.">
        <ChipGroup
          label="Dealbreakers"
          options={dealbreakerOptions}
          value={inputs.dealbreakers}
          onChange={(v) => update({ dealbreakers: v as Dealbreaker[] })}
        />
      </LabeledField>

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
    </div>
  );

  return (
    <div className="vr-container vr-stack" style={{ paddingBlock: "var(--sds-size-space-800)" }}>
      <TextContentTitle title="Plan your spin" subtitle="8 quick questions · about a minute" />

      {isMobile ? (
        <div className="vr-stack">
          <div className="vr-row" style={{ justifyContent: "space-between" }}>
            <TextSmall className="vr-muted">{`Step ${step} of 2`}</TextSmall>
          </div>
          <div className="vr-progress" aria-hidden="true">
            <div className="vr-progress-fill" style={{ width: step === 1 ? "50%" : "100%" }} />
          </div>

          {step === 1 ? whenWhere : vibeBudget}

          <hr className="vr-divider" />
          {step === 1 ? (
            <Button variant="primary" onPress={goNext}>
              Next
            </Button>
          ) : (
            <ButtonGroup align="justify">
              <Button variant="neutral" onPress={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onPress={submit}>
                See my picks
              </Button>
            </ButtonGroup>
          )}
        </div>
      ) : (
        <div className="vr-stack">
          <div className="vr-form-grid">
            {whenWhere}
            {vibeBudget}
          </div>
          {showErrors && !validation.valid && (
            <Text style={{ color: "var(--sds-color-text-danger-default)" }}>
              Please fix the highlighted fields to continue.
            </Text>
          )}
          <hr className="vr-divider" />
          <div className="vr-row" style={{ justifyContent: "space-between" }}>
            <Button variant="neutral" href="/#/">
              Back
            </Button>
            <Button variant="primary" onPress={submit}>
              See my picks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
