export type ISignature = {
    signature: {
        r: string;
        s: string
    }
}

export type BetOption = {
    id: number;
    name: string;
    description: string
};

export type OngoingBet = ISignature & {
    id: number;
    name: string;
    description: string;
    bet_start_date: number;
    bet_end_date: number
    bet_options: BetOption[]
};

export type FinishedBet = OngoingBet & {
    winner?: number
}