import React from "react";
import classes from './ClaimRewardButton.module.css'

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const ClaimRewardButton = ({ children, ...props }: IProps) => {
    return <button {...props} className={classes.myBtn}>{children}</button>
}

export default ClaimRewardButton;