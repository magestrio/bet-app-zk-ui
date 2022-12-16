import React from "react";
import classes from './BetInput.module.css'

interface Props {
    children?: React.ReactNode;
    type: "submit" | "button" | "numeric";
}
export type Ref = HTMLInputElement;

interface IProps extends React.ComponentPropsWithoutRef<'input'> {
    children: React.ReactNode;
}

const BetInput = React.forwardRef<Ref, IProps>((props, ref) => (
    <div className="input-box">
        <label htmlFor="bet_amount">Place your bet (Min sum 100 BET)</label>
        <span className="prefix">BET</span>
        <input ref={ref} className={classes.myInput} {...props} />
    </div>
))

export default BetInput;