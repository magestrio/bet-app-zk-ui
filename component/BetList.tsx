import React from "react";
import { OngoingBet } from "../pages/api/bet";
import BetItem from "./BetItem";
import styles from '../styles/App.module.css';

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const BetList = (args: { ongoingBets: OngoingBet[], onBetPlaced: (bet: OngoingBet, choosenBet: number, amount: number) => void }) => {
    return <div>
        <h1 className={styles.ongoing_bets_title}>Ongoing Bets</h1>
        <div>
            {
                args.ongoingBets.map(bet => <BetItem bet={bet} onBetPlaced={args.onBetPlaced} key={bet.id}></BetItem>)
            }
        </div>
    </div>
}

export default BetList;