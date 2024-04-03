import type { ActionType } from './context';

export default function handleBalanceLoadingState({
    shouldRunSim,
    balanceDispatch,
    years,
}: {
    shouldRunSim: boolean | undefined;
    balanceDispatch: React.Dispatch<ActionType>
    years: number
}) {
    if (shouldRunSim) {
        balanceDispatch({
            type: "SIM_RUN",
            years: years,
        })
    } else {
        balanceDispatch({
            type: "TOTAL_BAL_SET_HIDDEN",
            finalNetWorthHidden: true,
        })
    }
}
