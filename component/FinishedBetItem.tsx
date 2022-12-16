import React, { useState } from "react";
import { FinishedBet, OngoingBet } from "../pages/api/bet";
import styles from '../styles/App.module.css';
import ClaimRewardButton from "./button/ClaimButton";
import BetInput from "./input/BetInput";

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const FinishedBetItem = (args: { bet: FinishedBet, claimReward: (bet: FinishedBet, choosenBet: number, amount: number) => void }, { children, ...props }: IProps) => {
    const [amount, setAmount] = useState({ betAmount: 0 })

    const startBetDate = new Date(args.bet.bet_start_date).toDateString();
    const endBetDate = new Date(args.bet.bet_end_date).toDateString();

    function click(id: number) {
        args.claimReward(
            args.bet,
            id,
            amount.betAmount
        )
    }

    return <div className={styles.bet}>
        <div className={styles.text}>
            <strong>{args.bet.name} {startBetDate} {endBetDate}</strong>
            <hr style={{ margin: '15px 0' }} />
            <div>
                {args.bet.description}
            </div>
        </div>
        <ClaimRewardButton>Claim Reward</ClaimRewardButton>
    </div >
}

export default FinishedBetItem;