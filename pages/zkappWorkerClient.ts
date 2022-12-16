import {
    fetchAccount,
    PublicKey,
    PrivateKey,
    Field,
    UInt64,
    Account
} from 'snarkyjs'
import { OngoingBet } from './api/bet';

import type { ZkappWorkerRequest, ZkappWorkerReponse, WorkerFunctions } from './zkappWorker';

export default class ZkappWorkerClient {

    // ---------------------------------------------------------------------------------------

    loadSnarkyJS() {
        return this._call('loadSnarkyJS', {});
    }

    setActiveInstanceToBerkeley() {
        return this._call('setActiveInstanceToBerkeley', {});
    }

    loadBetTokenContract() {
        return this._call('loadBetTokenContract', {});
    }

    compileBetTokenContract() {
        return this._call('compileBetAppContract', {});
    }

    loadBetAppContract() {
        return this._call('loadBetAppContract', {});
    }

    compileBetAppContract() {
        return this._call('compileBetTokenContract', {});
    }

    fetchAccount({ publicKey }: { publicKey: PublicKey }): ReturnType<typeof fetchAccount> {
        const result = this._call('fetchAccount', { publicKey58: publicKey.toBase58() });
        return (result as ReturnType<typeof fetchAccount>);
    }

    fetchBetAccount({ publicKey }: { publicKey: PublicKey }): ReturnType<typeof fetchAccount> {
        const result = this._call('fetchBetAccount', { publicKey58: publicKey.toBase58() });
        return (result as ReturnType<typeof fetchAccount>);
    }

    placeBetTransaction(publicKey: PublicKey, bet: OngoingBet, choosenBet: number, amount: number) {
        return this._call('placeBetTransaction', {
            publicKey58: publicKey.toBase58(),
            bet: bet,
            choosenBet: choosenBet,
            amount: amount
        })
    }

    provePlaceBetTransaction() {
        return this._call('provePlaceBetTransaction', {});
    }

    async getPlaceBetTransactionJSON() {
        return await this._call('getPlaceBetTransactionJSON', {});
    }

    async getBetBalance(publicKey: PublicKey): Promise<BigInt> {
        const result = await this._call('getBetBalance', { publicKey58: publicKey.toBase58() });
        return result as BigInt;
    }

    initBetTokenContractInstance(publicKey: PublicKey) {
        this._call('initBetTokenContractInstance', { publicKey58: publicKey.toBase58() });
    }

    initBetAppContractInstance(publicKey: PublicKey) {
        this._call('initBetAppContractInstance', { publicKey58: publicKey.toBase58() });
    }

    createFaucetTransaction(publicKey: PublicKey) {
        return this._call('createFaucetTransaction', { publicKey58: publicKey.toBase58() });
    }

    createUpdateTransaction() {
        return this._call('createFaucetTransaction', {});
    }

    proveUpdateTransaction() {
        return this._call('proveFaucetTransaction', {});
    }

    async getTransactionJSON() {
        const result = await this._call('getFaucetTransactionJSON', {});
        return result;
    }

    // ---------------------------------------------------------------------------------------

    worker: Worker;

    promises: { [id: number]: { resolve: (res: any) => void, reject: (err: any) => void } };

    nextId: number;

    constructor() {
        this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url))
        this.promises = {};
        this.nextId = 0;

        this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
            this.promises[event.data.id].resolve(event.data.data);
            delete this.promises[event.data.id];
        };
    }

    _call(fn: WorkerFunctions, args: any) {
        return new Promise((resolve, reject) => {
            this.promises[this.nextId] = { resolve, reject }

            const message: ZkappWorkerRequest = {
                id: this.nextId,
                fn,
                args,
            };

            this.worker.postMessage(message);

            this.nextId++;
        });
    }
}