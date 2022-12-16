
# Bet ZK application: UI

Bet application is designed to provide secure and decentralized way to bet on current events. The user has a list of events (i.e., football matches) where everyone can choose a winner from the available options (i.e. team 1 win / team 2 win / draw). They can place a bet with an app-related coin called BET. After the end of the event oracle server will be updated and the winner will be revealed. The winners receive their rewards, the losers lose everything they wagered.

It is supposed to make up of 3 parts:
  - UI + Smart Contract
  - Offchain server
  - Oracle server 

## How to run project for Berkeley testnet

### Running oracle server

Go to oracle repository and follow the steps described there

### Running UI

```sh
npm run dev
```

## All repository locations:
  - (UI) https://github.com/magestrio/bet-app-zk-ui (you are here)
  - (Smart Contracts) https://github.com/magestrio/bet-app-zk-contracts
  - (Oracle) https://github.com/magestrio/bet-oracle
  - (Off-chain) https://github.com/magestrio/bet-offchain

## Future milestone
  - Improving UI
  - Swapping MINA -> BET, BET -> MINA

## License

[Apache-2.0](LICENSE)
