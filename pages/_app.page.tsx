import '../styles/globals.css'
import { use, useEffect, useState } from "react";
import ConnectWalletButton from '../component/button/ConnectWalletButton';
import ZkappWorkerClient from './zkappWorkerClient';
import styles from '../styles/App.module.css';

import {
  isReady,
  shutdown,
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt64,
  Signature,
  PublicKey,
  DeployArgs,
  Ledger,
  Field
} from 'snarkyjs';
import { type } from 'os';
import { FinishedBet, OngoingBet } from './api/bet';
import BetList from '../component/BetList';
import Loading from '../component/loading/Loading';
import FinishedBetList from '../component/FinishedBetList';

let transactionFee = 0.1;

export default function App() {
  const [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    betTokenContracthasBeenSetup: false,
    betAppContracthasBeenSetup: false,
    publicKey: null as null | PublicKey,
    betBalanceAmount: BigInt(0),
    isZkWorkerInited: false,
    isLoading: true,
    stateMessage: "",
    isWalletConnected: false,
    errorMessage: "",
    isTransactionExecuting: false
  })

  const [betState, setBetState] = useState({
    ongoingBets: null as null | OngoingBet[],
    finishedBets: null as null | OngoingBet[],
  })

  async function updateState() {

  }

  useEffect(() => {
    fetch('http://localhost:3005/bets')
      .then((res) => res.json())
      .then((data) => {
        const ongoingBets = data.ongoing_bets as OngoingBet[];
        const finishedBets = data.finished_bets as FinishedBet[];
        
        console.log('ongoingBets', ongoingBets)

        setBetState({
          ...state,
          ongoingBets: ongoingBets,
          finishedBets: finishedBets
        })
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    (async () => {
      const zkappWorkerClient = new ZkappWorkerClient();

      console.log('Waiting is ready')
      setState({ ...state, stateMessage: "Loading Snarky Js..." });
      await zkappWorkerClient.loadSnarkyJS();

      console.log('Setting network')
      setState({ ...state, stateMessage: "Setting network" });
      await zkappWorkerClient.setActiveInstanceToBerkeley()

      setState({
        ...state,
        isZkWorkerInited: true,
        zkappWorkerClient: zkappWorkerClient
      })
    })()
  }, []);

  useEffect(() => {
    (async () => {
      if (!state.betAppContracthasBeenSetup && state.isZkWorkerInited) {
        console.log('Load app contract')
        await state.zkappWorkerClient!.loadBetAppContract();
        console.log('Compile app contract')
        await state.zkappWorkerClient!.compileBetAppContract();

        const zkAppPrivateKey = PrivateKey.fromBase58('EKEjteHUynLTh6De95t9xH67AHjBfHTHYnZGaKEwsfsHFPBPwJF1');
        const zkAppAddress = zkAppPrivateKey.toPublicKey();

        console.log('Compile app contract')
        state.zkappWorkerClient!.initBetAppContractInstance(zkAppAddress);

        setState({
          ...state,
          betAppContracthasBeenSetup: true
        })
      }
    })()
  }, [state.isZkWorkerInited]);

  useEffect(() => {
    (async () => {
      if (!state.betTokenContracthasBeenSetup && state.isZkWorkerInited) {
        console.log('Start')

        setState({ ...state, stateMessage: "Loading and compile BetTokenContract" });
        console.log('Load contract')
        await state.zkappWorkerClient!.loadBetTokenContract();
        console.log('Compile contract')
        await state.zkappWorkerClient!.compileBetTokenContract();

        const zkAppPrivateKey = PrivateKey.fromBase58('EKEpu6aFo9RF4juALwXjadcrWiSFHUovJiEkk8TzrfV7btrHmJke');
        const zkAppAddress = zkAppPrivateKey.toPublicKey();

        console.log('Private address', zkAppPrivateKey.toBase58());
        console.log('Public address', zkAppAddress.toBase58());

        state.zkappWorkerClient!.initBetTokenContractInstance(zkAppAddress);

        setState({
          ...state,
          betTokenContracthasBeenSetup: true,
          isLoading: false,
          stateMessage: ""
        })
      }
    })();
  }, [state.isZkWorkerInited]);

  useEffect(() => {
    (async () => {
      if (!state.isWalletConnected || !state.betTokenContracthasBeenSetup) {
        return;
      }

      console.log('loading balance')
      const res = await state.zkappWorkerClient!.fetchBetAccount({
        publicKey: state.publicKey!
      });
      const isAccountExist = res.error == null;

      const balance = isAccountExist ? await (await state.zkappWorkerClient!.getBetBalance(state!.publicKey!)).valueOf() : BigInt(0);

      console.log('balance', balance);
      setState({
        ...state,
        betBalanceAmount: balance
      })
    })()
  }, [state.isWalletConnected, state.betTokenContracthasBeenSetup])

  async function placeBet(bet: OngoingBet, choosenBet: number, amount: number) {
    if (!state.betTokenContracthasBeenSetup) {
      return
    }

    console.log('create a place bet transaction')
    await state.zkappWorkerClient?.placeBetTransaction(
      state.publicKey!,
      bet,
      choosenBet,
      amount
    )

    console.log('prove place bet transaction')
    await state.zkappWorkerClient?.provePlaceBetTransaction();

    console.log('generate place bet transaction JSON')
    const transactionJSON = await state.zkappWorkerClient?.getPlaceBetTransactionJSON();

    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: 'zk',
      },
    });
  }

  async function claimReward() {
    
  }
  
  async function onConnectWalletClick() {
    console.log('onConnectWalletClick')

    const mina = (window as any).mina;

    const publicKeyBase58: string = (await mina.requestAccounts())[0];
    const publicKey = PublicKey.fromBase58(publicKeyBase58);

    console.log('using key', publicKey.toBase58());

    setState({
      ...state,
      publicKey: publicKey,
      isWalletConnected: true
    })
  }

  async function faucet() {
    if (!state.betTokenContracthasBeenSetup && !state.isWalletConnected && !state.isTransactionExecuting) {
      return
    }

    setState({
      ...state,
      isTransactionExecuting: true
    })

    await state.zkappWorkerClient!.fetchBetAccount({ publicKey: state.publicKey! })

    console.log('creating transaction...');
    setState({ ...state, isLoading: true, stateMessage: "Creating transaction..." });
    await state.zkappWorkerClient!.createFaucetTransaction(state.publicKey!);

    console.log('creating proof...');
    setState({ ...state, stateMessage: "Creating proof..." });
    await state.zkappWorkerClient!.proveUpdateTransaction();

    console.log('getting Transaction JSON...');
    setState({ ...state, stateMessage: "Getting Transaction JSON..." });
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()

    console.log(transactionJSON);

    console.log('requesting send transaction...');
    setState({ ...state, stateMessage: "Requesting send transaction..." });
    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: 'zk',
      },
    });

    if (hash == null) {
      console.log('error sending transaction (see above)');
    } else {
      console.log(
        'See transaction at',
        'https://berkeley.minaexplorer.com/transaction/' + hash
      );
    }

    setState({
      ...state,
      isTransactionExecuting: false,
      isLoading: false
    })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.wallet}>
          <ConnectWalletButton onClick={onConnectWalletClick}>
            <span>
              {state.publicKey && state.publicKey.toBase58().length > 0
                ? `${state.publicKey.toBase58().slice(0, 6)}...${state!.publicKey.toBase58().slice(-4)}`
                : "Connect Wallet"}
            </span>
          </ConnectWalletButton>
          <button>Clear Bet Contract state</button>
          <button>Clear App Contract state</button>
        </div>
        <div className={styles.loading}>
          {state.isLoading ? <Loading /> : null}
          <p className={styles.text}>{state.stateMessage}</p>
        </div>
        <div className={styles.account}>
          <ConnectWalletButton onClick={faucet}>Faucet</ConnectWalletButton>
          <p className={styles.balance}>{`Your BET balance: ${state.betBalanceAmount}`}</p>
        </div>
      </header>
      <body className={styles.main}>
        <BetList ongoingBets={betState.ongoingBets || []} onBetPlaced={placeBet}></BetList>
        <FinishedBetList ongoingBets={betState.finishedBets || []} claimReward={placeBet}></FinishedBetList>
      </body>
    </div>
  )

}