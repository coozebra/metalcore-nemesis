# Nemesis

## Description

Service that connects games to the blockchain and vice-versa.

## Setup

Install packages.

```
$ npm install
```

## Commands

### Locally (Development)

Copy the `example.env` to `.env`

```shell script
cp example.env .env
```

Run the `docker-compose.yml` to init the infrastructure services:

```shell script
docker-compose up
```

```shell script
# Server
npm run start:dev

# Workers
npm run start:dev:worker -- --worker <WorkerName>
```

### Live

```shell script
# Server
node dist/server.ts

# Worker
node dist/worker.ts -- --worker <WorkerName>
```

### Building & Releasing

First, compile the application:

```shell script
npm run build
```

This will create a directory with optimized JS files under `dist`.

Make sure the entry point on the `Dockerfile` is properly set so the container starts when pushed

## Other useful commands

### Collection creation

To create a collection, use the following command:

```shell script
# Live
npm run create:collection

# Local
npm run create:dev:collection
```

This will prompt you steps to follow to create the collection

## API Reference

We document our API using swagger. Access `http://localhost:3003/docs` after the server starts to explore the available endpoints.

---

# Solution overview

Nemesis holds the relation between the following **entities**:

```
[Games] --------- [Studios]
   |                  |
[Collections]      [Users] -----------|
  |       |           |               |
[Assets]  |       [Player Resources]  |
  | [Resources] ------|               |
  |------------------------------------
```

Refer to the following link for a more detailed view:

https://cdn.discordapp.com/attachments/978304000996823050/983777764563882124/unknown.png

That means:

- Studios have Games.
- Games have Collections.
- Collections can be Asset-type (ERC-721) or Resource-type (ERC-1155).

- Studios have Users/Players
- Players have Player Resources
- Player Resources refer to a Resource
- Assets MAY relate to Players (that means an Asset can belong to no one, in the Game perspective)

### Relation to the Blockchain

In a high-level view, Nemesis fits between the Blockchain and the Game.
Both Nemesis and the Game know the authentication and user management service. Currently PlayFab.

```
[GamePortal]---------------
            \              \
[Game] ---- [Nemesis] ---- [Blockchain]
  \           /
   [User Base]
```

> **_NOTE_:** Game Portal sometimes interacts with the Blockchain. E.g.: Deposit/withdraw of Assets.

### Use cases

Key concepts:

- Studio -> Game development company
- Game -> Studio's product
- Player -> User registered within the user base and able to play the game
- Asset -> Usable item. Eventually related to a Non-Fungible Token
- Smart Contract -> Ethereum-compatible program that runs on some Blockchain
- Portal/Game Portal -> Interactive off-game part of the game, probably a web page. Shows player info, inventory, and may have a shop
- Game Portal Contract -> Blockchain program that has basic functionality to generate, terminate, accept or reject assets from collections
- Deposit -> Give ownership of the Asset to the Game Portal Contract
- Withdraw -> Assign your wallet as the owner of an NFT deposited by some source
- Signature -> Cryptographic proof that an operation was reviewed and authorized by a trusted source like Nemesis

A brief story of the flow from the Game creation to the Assets earning:

Studios are on-boarded and create a Game. The Game must have at least a `Game Portal Contract`, optionally having ERC-20 tokens to serve as currencies. Not covered in this example. This Contract will be
the main source of interaction between the Game and the Blockchain. There will be made _deposits, withdraws, mints, and burns_.

Having your Game set, you may add Collections to represent items for your Game. Each collection points to a `Smart Contract`.
Let's assume your game uses Vehicles. You as the Game owner introduce a new Collection that relates to your Game, called Vehicles,
and point it to a blockchain address, with the ERC-721 standard. This way Nemesis can handle cases where your game gives players
a Vehicle.

For Players to be able to play your Game, they must register first. They'll create an account through the Portal, and optionally
link a Wallet Address to their account. **Players belong to the Studio so they're able to play all games within a Studio.**

Players during their journey may earn a Vehicle. Your Game can ask Nemesis to mint an ERC-721 token. If everything is valid, the
next time the worker runs, it'll squash many earns from many players and mint them all in a batch to the `Game Portal Contract`.
Those Vehicles are assigned to their respective Players but locked within the Game Portal Contract.

Players can now withdraw to their Wallet Addresses to make use of the blockchain's decentralization. For that, Players must link
their wallets to their accounts. Accessing the Game Portal they'll see listed their deposited and non-deposited assets. That means
their assets can only be used in-game when locked/deposited. Through the Portal, Players grab a Signature to interact with the Game
Portal Contract.

If Players obtained some Asset somewhere else, other than the game, they must deposit it first so the Game can see it. The flow is
similar to the withdrawal: asking if the Player is eligible to deposit, obtaining a signature and interacting with the Contract.

The Portal, not the contract, interacts with Nemesis API to send information about the deposit/withdrawal and receives a signature if
the action is possible. Now the Portal, as a web page, **interacts directly with Game Portal Contract**.

> **_NOTE:_** As of now, the Private Key that is authorized to interact with all Game Portals is a global setting. This must be Game-Specific and perhaps not even held by Nemesis or any of us.


