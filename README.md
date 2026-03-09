# EqualPay Oracle Registry

A verifiable, research-grade gender pay transparency protocol.

EqualPay Oracle Registry enables companies to publish aggregated pay reports, anchor them cryptographically on-chain, and produce reproducible gender pay gap metrics without exposing individual salary data.

The system combines deterministic data processing with blockchain commitments to make pay transparency verifiable, reproducible, and privacy-safe.

## Problem

Gender pay gap disclosures today suffer from several issues:

- reports are often self-reported

- methodologies are inconsistent

- results are not reproducible

- data aggregation can hide structural inequality

- claims cannot be cryptographically verified

- Transparency without reproducibility does not provide accountability.

## Solution

EqualPay Oracle Registry introduces a protocol where:

- companies submit aggregated pay reports

- reports are canonicalized and hashed

- the report commitment is anchored on-chain

- scores are deterministically computed

- results can be independently recomputed

- No individual salary data is stored anywhere.

## What We Built

### The prototype includes:

- Smart Contracts

- Solidity contracts that store:

	report commitments

	score publications

	verification state

	non-transferable verification badges

- Backend API

- NestJS backend responsible for:

	schema validation

	canonical JSON generation

	deterministic hashing

	gender pay gap scoring

	oracle publishing

	Oracle Adapter

	A service that publishes deterministic score results on-chain.



### Local Blockchain Demo

The full system runs locally using:

Hardhat node

deployed contracts

API interaction


## Tech Stack

Smart Contracts
Solidity + Hardhat

Backend
NestJS + TypeORM

Database
SQLite

Blockchain Client
viem

Local Network
Hardhat

Demo Flow

## The working prototype demonstrates the following lifecycle.

#### 1. Upload Report

```bash
POST /reports
```

Returns:

reportId, reportHash, companyId

#### 2. Commit Report On-Chain

```bash
submitReport (reportId, reportHash)
```

The contract stores the immutable report commitment.

#### 3. Compute Score

```bash
GET /reports/:reportId/score
```

Score is computed deterministically from canonical JSON.

#### 4. Oracle Publish

```bash
POST /oracle/publish/:reportId
```

#### Calls:

```bash
publishScore(reportId, scoreBps, methodologyId)
```

The score becomes publicly verifiable on-chain.


## Scoring Methodology (MVP)

The prototype computes the Mean Gender Pay Gap normalized by FTE.

meanF = totalBasePayF / totalFteF

meanM = totalBasePayM / totalFteM

gap = 1 − (meanF / meanM)

scoreBps = gap × 10,000

Stored on-chain:

int32 scoreBps
bytes32 methodologyId

Anyone can recompute the score from the canonical report JSON.

## Privacy Model

The system enforces privacy by design.

only aggregated data accepted

minimum cell size recommended

no individual salary data

no personal identifiers

blockchain stores only hashes and scores

## Limitations

### Current hackathon prototype limitations:

- no frontend UI

- local Hardhat demo environment

- attestation flow not fully integrated in API

- no automated payroll system verification

## Vision

EqualPay Oracle Registry aims to become a cryptographically verifiable pay transparency layer usable by:

- researchers

- journalists

- regulators

- NGOs

- employers

- employees

while preserving data privacy.

# How to Run Locally

## Start Hardhat node:
```bash
cd contracts
npx hardhat node
```
## Deploy contracts:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```
## Start API:
```bash
cd api
npm run start:dev
```

## Upload report:
```bash
curl -X POST http://localhost:3000/reports \
-H "Content-Type: application/json" \
--data @sample-report.v1.1.json
```

## Submit report on-chain:
```bash
npx hardhat run scripts/submitStoredReport.ts --network localhost
```
## Publish score:
```bash
curl -X POST http://localhost:3000/oracle/publish/REPORT_ID
```
## License
MIT