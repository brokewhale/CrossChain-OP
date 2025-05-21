# Cross-OP Bridge

A simple implementation of Optimism's cross-chain bridge operations using viem.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

3. Edit `.env` and add your:

- Private key (must start with 0x)
- L1 RPC URL (Sepolia)
- L2 RPC URL (Optimism Sepolia)

## Usage

### Deposit ETH to L2

```bash
npm run dev
```

### Withdraw ETH from L2

```bash
npm run withdraw
```

## Features

- Deposit ETH from L1 (Sepolia) to L2 (Optimism Sepolia)
- Withdraw ETH from L2 back to L1
- Balance checking on both chains
- Transaction status monitoring
