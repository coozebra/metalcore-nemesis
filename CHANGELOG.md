# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [0.4.2] - 2022-11-11

### Added

- Solution overview documentation on README

### Fixed

- fixed `GET: /server/games/{gameId}/users?walletAddress` swagger doc

## [0.4.1] - 2022-11-10

### Added

- reporter to read gas metrics

### Changed

- mocked playfab api calls on tests

## [0.4.0] - 2022-11-07

### Added

- displayName endpoint through `GET: /server/games/{gameId}/users?walletAddress`
- hardhat environment for blockchain integration testing
- receipt processor workflow to `TransactionWorker`
- worker to process Asset NFT deposit and withdraw from the GP contract
- endpoint GET /users/assets/:gameId to list user's deposited assets
- deposit assets' signature emission endpoint GET /users/assets/deposit
- worker deployments on Makefile
- non-deposited assets fetcher to serve user's inventory
- endpoint PATCH /studios/assets/:assetId/attributes to update attributes of an asset

### Fixed

- refactored and fixed a bug with Asset minting workflow
- fixed method to find non-submitted transactions
- game portal's deposit and withdraw jobs are now properly enqueued with game portal address

### Changed

- change password restriction to use 32 characters at max
- changed Logger to depend on an internal type
- changed Logger service to Winston
- added more logging for workers
- updated IORedis v4 -> v5 and BullMQ v1 -> v3
- ERC-721 and ERC-1155 domain terms come from a standard enum now
- deactivated ERC-1155 Schedulers because they're not stable

## [0.3.4] - 2022-10-17

### Fixed

- jwt in login response

## [0.3.3] - 2022-10-12

### Changed

- remove production restriction from `GET/POST /studios/users`

## [0.3.2] - 2022-10-07

### Fixed

- improve errors consistency

## [0.3.1] - 2022-10-06

### Fixed

- improve error handling for `/tokens`

## [0.3.0] - 2022-10-04

### Added

- claim access key endpoint: /users/access-keys
- burn assets endpoint: POST /studios/assets/burn
- RequestBodyChecker middleware for better error handling
- worker to burn assets

### Changed

- improve errors consistency
- Requirements for claiming an access keys
- POST /studios/assets now generates a mint transaction request
- Add production access restriction to /studios namespace and /docs

## [0.2.0] 2022-08-29

### Changed

- re-route: /login -> /users/login
- re-route: /wallet -> /users/wallet
- re-route: /studios/users/increment-balance -> /studios/users/balances/increment
- re-route: /studios/users/decrement-balance -> /studios/users/balances/decrement
- better error handling accordingly to http://jsonapi.org
- refactor wallet linking to check message and signature
- json api request format adequation on /users/login; /users/wallet

### Added

- worker to handle on-chain transactions
- playfab account creation
- info endpoint
- game access keys management
- access keys population script for metalcore

### Fixed

- fix name in Makefile
- better conflict errors to wallet registration
- returns unauthorized when session ticket is invalid

## [0.1.1] 2022-07-29

### Added

- assets population and initial token id assignment scripts

### Changed

- token metadata API now returns real data

## [0.1.0] 2022-07-27

### Added

- initial version
- user creation
- games management
- assets management
- studios management
- resources management
- collections management
- wallet registration
- authentication middleware
- user login authorization on external service
- retrieve all assets and by accountId endpoint
- retrieve users by userId and accountId endpoint
- JWT issuing for users' Single Sign On
- increment/decrement users' balances
- atomic user resources increment and enqueue on MongoDB job to mint
- placeholder token response
