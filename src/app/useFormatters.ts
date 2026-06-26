import { useMemo } from "react";
import {
  budgetTotalUsd,
  createMockProviders,
  makeMoneyFormatter,
} from "../engine";
import { useSession } from "../state/SessionContext";

/** Money + budget helpers bound to the session's display currency. */
export function useFormatters() {
  const { inputs } = useSession();
  const providers = useMemo(() => createMockProviders(false), []);
  const money = useMemo(
    () => makeMoneyFormatter(inputs.budget.currency, providers.fx),
    [inputs.budget.currency, providers],
  );
  const budgetUsd = useMemo(
    () => budgetTotalUsd(inputs, providers.fx),
    [inputs, providers],
  );
  return { money, budgetUsd };
}
