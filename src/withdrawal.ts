import {
  createPublicClient,
  http,
  createWalletClient,
  parseEther,
  formatEther,
  encodeFunctionData,
} from 'viem';
import { mainnet, base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import {
  getL2TransactionHashes,
  publicActionsL1,
  publicActionsL2,
  walletActionsL1,
  walletActionsL2,
} from 'viem/op-stack';
import 'dotenv/config';
import { optimismPortal2Abi } from './optimismPortal2Abi';

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
  chain: mainnet,
  transport: http(L1_RPC_URL),
}).extend(publicActionsL1());

const walletClientL1 = createWalletClient({
  account,
  chain: mainnet,
  transport: http(L1_RPC_URL),
}).extend(walletActionsL1());

// Initialize L2 clients
const publicClientL2 = createPublicClient({
  chain: base,
  transport: http(L2_RPC_URL),
}).extend(publicActionsL2());

const walletClientL2 = createWalletClient({
  account,
  chain: base,
  transport: http(L2_RPC_URL),
}).extend(walletActionsL2());

async function withdrawETH() {
  try {
    // Step 1: Initiate withdrawal
    // console.log('Step 1: Initiating withdrawal...');
    // const withdrawArgs = await publicClientL1.buildInitiateWithdrawal({
    //   value: parseEther('0.0001'),
    //   to: account.address,
    // });

    // const withdrawalHash = await walletClientL2.initiateWithdrawal(
    //   withdrawArgs
    // );
    const withdrawalHash =
      '0xba9b0aac9f7585a0bd0e51d6c582c2b8d14405ecccddf332ff4817fe03b4339e';

    console.log(`Withdraw transaction hash on L2: ${withdrawalHash}`);

    const withdrawalReceipt = await publicClientL2.waitForTransactionReceipt({
      hash: withdrawalHash,
    });
    console.log('Step 1 completed: L2 transaction confirmed');

    // Step 2: Wait and prove withdrawal
    console.log('Step 2: Waiting for withdrawal to be ready to prove...');
    console.log(
      'Note: This step might take several minutes as we wait for the transaction to be ready to prove'
    );
    const { output, withdrawal } = await publicClientL1.waitToProve({
      receipt: withdrawalReceipt,
      targetChain: walletClientL2.chain,
    });
    console.log('Withdrawal ready to prove');

    console.log('Building prove withdrawal arguments...');
    const proveArgs = await publicClientL2.buildProveWithdrawal({
      output,
      withdrawal,
    });

    const proveWithdrawalFunctionData = encodeFunctionData({
      abi: optimismPortal2Abi,
      functionName: 'proveWithdrawalTransaction',
      args: [
        proveArgs.withdrawal,
        proveArgs.l2OutputIndex,
        proveArgs.outputRootProof,
        proveArgs.withdrawalProof,
      ],
    });

    console.log('proveArgs', proveWithdrawalFunctionData);

    // console.log('Proving withdrawal...');
    // const proveHash = await walletClientL1.proveWithdrawal(proveArgs);
    // const proveReceipt = await publicClientL1.waitForTransactionReceipt({
    //   hash: proveHash,
    // });
    // console.log('Step 2 completed: Withdrawal proven', proveReceipt);

    //   // Step 3: Wait and finalize withdrawal
    //   console.log('Step 3: Waiting for withdrawal to be ready to finalize...');
    //   await publicClientL1.waitToFinalize({
    //     targetChain: walletClientL2.chain,
    //     withdrawalHash: withdrawal.withdrawalHash,
    //   });
    //   console.log('Withdrawal ready to finalize');

    //   console.log('Finalizing withdrawal...');
    //   const finalizeHash = await walletClientL1.finalizeWithdrawal({
    //     targetChain: walletClientL2.chain,
    //     withdrawal,
    //   });

    //   const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({
    //     hash: finalizeHash,
    //   });
    //   console.log('Step 3 completed: Withdrawal finalized');
  } catch (error) {
    console.error('Error during withdrawal process:', error);
    throw error;
  }
}

const main = async () => {
  try {
    const l2Balance = await publicClientL2.getBalance({
      address: account.address,
    });
    console.log(`L2 Balance: ${formatEther(l2Balance)} ETH`);

    await withdrawETH();
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
};

main().catch(console.error);
