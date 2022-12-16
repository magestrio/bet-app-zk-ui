import React from "react";
import { FinishedBet } from "../pages/api/bet";
import FinishedBetItem from "./FinishedBetItem";
import styles from '../styles/App.module.css';

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const FinishedBetList = (args: { ongoingBets: FinishedBet[], claimReward: (bet: FinishedBet, choosenBet: number, amount: number) => void }) => {
    return <div>
        <h1 className={styles.finished_bets_title}>Finished Bets</h1>
        <div>
            {
                args.ongoingBets.map(bet => <FinishedBetItem bet={bet} claimReward={args.claimReward} key={bet.id}></FinishedBetItem>)
            }
        </div>
    </div>
}

export default FinishedBetList;