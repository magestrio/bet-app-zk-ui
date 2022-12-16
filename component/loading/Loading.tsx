import React from "react";
import classes from './Loading.module.css'

const Loading = () => {
    return (
        <div className={classes.spinner_container}>
            <div className={classes.loading_spinner}>
            </div>
        </div>
    );
}

export default Loading;