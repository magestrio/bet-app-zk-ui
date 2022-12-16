import React from "react";
import classes from './ConnectWalletButton.module.css'

interface IProps extends React.ComponentPropsWithoutRef<"button"> {
    children: React.ReactNode;
}

const ConnectWalletButton = ({ children, ...props }: IProps) => {
    return <button {...props} className={classes.myBtn}>{children}</button>
}

export default ConnectWalletButton;