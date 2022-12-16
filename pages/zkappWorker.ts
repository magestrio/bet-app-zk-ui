import { BetTokenContract } from '../../contracts/build/src/BetTokenContract.js';
import { BetAppContract } from '../../contracts/build/src/BetAppContract.js';
import { Event } from '../../contracts/build/src/Event.js';
import { Bet } from '../../contracts/build/src/Bet.js';

import {
    Mina,
    isReady,
    PublicKey,
    PrivateKey,
    Field,
    fetchAccount,
    MerkleMapWitness,
    MerkleMap,
    Poseidon,
    Ledger,
    UInt64,
    UInt32,
    Signature
} from 'snarkyjs'
import { OngoingBet } from './api/bet.js';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

// ---------------------------------------------------------------------------------------
const state = {
    BetAppContract: null as null | typeof BetAppContract,
    betAppContract: null as null | BetAppContract,
    BetTokenContract: null as null | typeof BetTokenContract,
    betTokenOwner: null as null | BetTokenContract,
    faucetTransaction: null as null | Transaction,
    placeBetTransaction: null as null | Transaction
}

// ---------------------------------------------------------------------------------------

const functions = {
    // General
    loadSnarkyJS: async (args: {}) => {
        await isReady;
    },
    setActiveInstanceToBerkeley: async (args: {}) => {
        const Berkeley = Mina.Network(
            "https://proxy.berkeley.minaexplorer.com/graphql"
        );
        Mina.setActiveInstance(Berkeley);
    },

    // Bet token contract
    loadBetTokenContract: async (args: {}) => {
        const { BetTokenContract } = await import('../../contracts/build/src/BetTokenContract.js');
        state.BetTokenContract = BetTokenContract;
    },
    compileBetTokenContract: async (args: {}) => {
        await state.BetTokenContract!.compile();
    },
    initBetTokenContractInstance: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        state.betTokenOwner = new state.BetTokenContract!(publicKey);
    },

    // Bet App contract
    loadBetAppContract: async (args: {}) => {
        const { BetAppContract } = await import('../../contracts/build/src/BetAppContract.js');
        state.BetAppContract = BetAppContract;
    },
    compileBetAppContract: async (args: {}) => {
        await state.BetAppContract!.compile();
    },
    initBetAppContractInstance: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        state.betAppContract = new state.BetAppContract!(publicKey);
    },
    placeBetTransaction: async (args: { publicKey58: string, bet: OngoingBet, choosenBet: number, amount: number }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        const event = new Event({
            id: UInt64.from(args.bet.id),
            betsStartDate: UInt64.from(args.bet.bet_start_date),
            betsEndDate: UInt64.from(args.bet.bet_end_date),
            betOptions: [UInt32.from(args.bet.bet_options[0].id), UInt32.from(args.bet.bet_options[1].id), UInt32.from(args.bet.bet_options[2].id)]
        });

        const bet = new Bet({
            eventId: event.id,
            betOptionId: UInt32.from(args.choosenBet),
            bettorAddress: publicKey,
            betTokenAmount: UInt64.from(args.amount)
        })

        const signature = Signature.fromJSON(args.bet.signature);

        console.log('main bet', args.bet);
        console.log('event', event);
        console.log('bet', bet);

        // User haven't placed any bet yet
        const tree = new MerkleMap();
        const witness = tree.getWitness(bet.hash());

        const transaction = await Mina.transaction(() => {

            state.betAppContract!.placeBet(event, bet, witness, signature)
        })

        state.placeBetTransaction = transaction;
    },
    provePlaceBetTransaction: async (args: {}) => {
        await state.placeBetTransaction!.prove();
    },
    getPlaceBetTransactionJSON: async (args: {}) => {
        return state.placeBetTransaction!.toJSON();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        return await fetchAccount({ publicKey });
    },
    fetchBetAccount: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        return fetchAccount({ publicKey, tokenId: Ledger.fieldToBase58(state.betTokenOwner!.token.id) })
    },
    getBetBalance: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        const account = await fetchAccount({ publicKey, tokenId: Ledger.fieldToBase58(state.betTokenOwner!.token.id) })
        return account.account?.balance.toBigInt();
    },
    createFaucetTransaction: async (args: { publicKey58: string }) => {
        const publicKey = PublicKey.fromBase58(args.publicKey58);
        // Call to the off-chain storage
        const tree = new MerkleMap();
        const witness = tree.getWitness(Poseidon.hash(publicKey.toFields()));
        const lastTimeFauceted = UInt64.from(0);
        const transaction = await Mina.transaction(() => {
            state.betTokenOwner!.faucet(publicKey, witness, lastTimeFauceted);
        });
        state.faucetTransaction = transaction;
    },
    proveFaucetTransaction: async (args: {}) => {
        await state.faucetTransaction!.prove();
    },
    getFaucetTransactionJSON: async (args: {}) => {
        return state.faucetTransaction!.toJSON();
    },
};

// ---------------------------------------------------------------------------------------

export type WorkerFunctions = keyof typeof functions;

export type ZkappWorkerRequest = {
    id: number,
    fn: WorkerFunctions,
    args: any
}

export type ZkappWorkerReponse = {
    id: number,
    data: any
}
if (process.browser) {
    addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
        const returnData = await functions[event.data.fn](event.data.args);

        const message: ZkappWorkerReponse = {
            id: event.data.id,
            data: returnData,
        }
        postMessage(message)
    });
}