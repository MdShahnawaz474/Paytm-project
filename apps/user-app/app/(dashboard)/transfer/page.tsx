import prisma from "@repo/db/client";
import { AddMoney } from "../../../components/AddMoneyCard";
import { BalanceCard } from "../../../components/BalanceCard";
import { OnRampTransactions } from "../../../components/OnRampTransactions";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

async function getBalance() {
    const session = await getServerSession(authOptions);

    // Fetch the balance for the logged-in user
    const balance = await prisma.balance.findFirst({
        where: {
            userId: Number(session?.user?.id)
        }
    });

    if (!balance) {
        return { amount: 0, locked: 0 };
    }

    // Get all processing transactions and calculate how much should be locked
    const processingTransactions = await prisma.onRampTransaction.findMany({
        where: {
            userId: Number(session?.user?.id),
            status: 'Processing'
        }
    });

    const lockedAmount = processingTransactions.reduce((total, txn) => total + txn.amount, 0);

    // Return balance with locked amount calculated from processing transactions
    return {
        amount: balance.amount - lockedAmount, // Available balance is the original balance minus the locked amount
        locked: lockedAmount // Locked amount is the total of processing transactions
    };
}

async function getOnRampTransactions() {
    const session = await getServerSession(authOptions);

    // Fetch the transactions for the logged-in user
    const txns = await prisma.onRampTransaction.findMany({
        where: {
            userId: Number(session?.user?.id)
        }
    });

    // Map through transactions and return required details
    return txns.map(t => ({
        time: t.startTime,
        amount: t.amount,
        status: t.status,
        provider: t.provider,
    }));
}

export default async function () {
    const balance = await getBalance();  // Get the updated balance with locked amount
    const transactions = await getOnRampTransactions();  // Get all user transactions

    return (
        <div className="w-screen mt-10">
            <div className="text-4xl text-[#508291] pt-8 mb-8 font-bold">
                Transfer
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
                <div>
                    <AddMoney />
                </div>
                <div>
                    <BalanceCard amount={balance.amount} locked={balance.locked} />
                    <div className="pt-4">
                        <OnRampTransactions transactions={transactions} />
                    </div>
                </div>
            </div>
        </div>
    );
}
