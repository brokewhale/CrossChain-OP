import {
  createPublicClient,
  http,
  createWalletClient,
  parseEther,
  formatEther,
} from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  getL2TransactionHashes,
  publicActionsL1,
  publicActionsL2,
  walletActionsL1,
  walletActionsL2,
} from 'viem/op-stack';
import 'dotenv/config';

// Setup environment and account
const PRIVATE_KEY = process.env.TUTORIAL_PRIVATE_KEY;
const L1_RPC_URL = process.env.L1_RPC_URL;
const L2_RPC_URL = process.env.L2_RPC_URL;

if (!PRIVATE_KEY)
  throw new Error('TUTORIAL_PRIVATE_KEY environment variable is not set');
if (!L1_RPC_URL) throw new Error('L1_RPC_URL environment variable is not set');
if (!L2_RPC_URL) throw new Error('L2_RPC_URL environment variable is not set');

const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

// Initialize L1 clients
const publicClientL1 = createPublicClient({
  chain: sepolia,
  transport: http(L1_RPC_URL),
}).extend(publicActionsL1());

const walletClientL1 = createWalletClient({
  account,
  chain: sepolia,
  transport: http(L1_RPC_URL),
}).extend(walletActionsL1());

// Initialize L2 clients
const publicClientL2 = createPublicClient({
  chain: baseSepolia,
  transport: http(L2_RPC_URL),
}).extend(publicActionsL2());

const walletClientL2 = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(L2_RPC_URL),
}).extend(walletActionsL2());

const main = async () => {
  const l1Balance = await publicClientL1.getBalance({
    address: account.address,
  });
  console.log(`L1 Balance: ${formatEther(l1Balance)} ETH`);

  // Run deposit after checking balance
  await depositETH();
};

async function depositETH() {
  const depositArgs = await publicClientL2.buildDepositTransaction({
    mint: parseEther('1'),
    to: account.address,
  });

  const depositHash = await walletClientL1.depositTransaction(depositArgs);
  console.log(`Deposit transaction hash on L1: ${depositHash}`);

  const depositReceipt = await publicClientL1.waitForTransactionReceipt({
    hash: depositHash,
  });
  console.log('L1 transaction confirmed:', depositReceipt);

  const [l2Hash] = getL2TransactionHashes(depositReceipt);
  console.log(`Corresponding L2 transaction hash: ${l2Hash}`);

  const l2Receipt = await publicClientL2.waitForTransactionReceipt({
    hash: l2Hash,
  });
  console.log('L2 transaction confirmed:', l2Receipt);
  console.log('Deposit completed successfully!');
}

async function getTXRe() {
  const hash =
    '0xcfd81f6d3a29a9a6c3b2ac72e45212d34f966ed0070e4b391ad36a9f6bbe538d';
  const l2Receipt = await publicClientL2.waitForTransactionReceipt({
    hash,
  });
  console.log('L2 transaction confirmed:', l2Receipt);
  console.log('Deposit completed successfully!');
}
main().catch(console.error);
