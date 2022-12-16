import React, { useState } from "react";
import { OngoingBet } from "../pages/api/bet";
import styles from '../styles/App.module.css';
import BetInput from "./input/BetInput";

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const BetItem = (args: { bet: OngoingBet, onBetPlaced: (bet: OngoingBet, choosenBet: number, amount: number) => void }, { children, ...props }: IProps) => {
    const [amount, setAmount] = useState({ betAmount: 0 })

    const startBetDate = new Date(args.bet.bet_start_date).toDateString();
    const endBetDate = new Date(args.bet.bet_end_date).toDateString();

    function click(id: number) {
        args.onBetPlaced(
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
        <div>
            <button className={styles.butt_a} onClick={e => click(0)}>
                {args.bet.bet_options[0].name}
            </button>
            <button className={styles.butt_b} onClick={e => click(2)}>
                {args.bet.bet_options[2].name}
            </button>
            <button className={styles.butt_c} onClick={e => click(1)}>
                {args.bet.bet_options[1].name}
            </button>
        </div>
        <BetInput
            type='numeric'
            onChange={e => {
                setAmount({ betAmount: Number(e.target.value) });
            }}
            children={undefined} />
    </div >
}

export default BetItem;