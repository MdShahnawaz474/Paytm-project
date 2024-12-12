import React from "react";
import { SendCard } from "../../../components/SendCard";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import prisma from "@repo/db/client";
import { BalanceCard } from "../../../components/BalanceCard";
import { P2PTransaction } from "../../../components/P2PTransaction";

// Fetch the user's balance and calculate the locked amount based on processing P2P transactions
async function getBalance() {
  const session = await getServerSession(authOptions);

  // Fetch balance for the logged-in user
  const balance = await prisma.balance.findFirst({
    where: {
      userId: Number(session?.user?.id),
    },
  });

  if (!balance) {
    return { amount: 0, locked: 0 };
  }

  // Fetch all P2P transactions that are in 'processing' status
  const processingTransactions = await prisma.onRampTransaction.findMany({
    where: {
        userId: Number(session?.user?.id),
        status: 'Processing'
    }
});

  // Calculate the total amount of processing transactions (locked amount)
  const lockedAmount = processingTransactions.reduce((total, txn) => total + txn.amount, 0);

  // Return balance with locked amount calculated
  return {
    amount: balance.amount - lockedAmount, // Available balance
    locked: lockedAmount, // Total locked amount from processing transactions
  };
}

// Fetch P2P transactions for the logged-in user
export async function getP2PTransaction() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

  // Fetch P2P transactions involving the logged-in user
  const txns = await prisma.p2pTransfer.findMany({
    where: {
      OR: [{ toUserId: userId }, { fromUserId: userId }],
    },
    include: {
      fromUser: true,
      toUser: true,
    },
  });

  return txns.map((t) => ({
    id: t.id,
    amount: t.amount,
    time: t.timestamp,
    direction: t.toUserId === userId ? ("received" as const) : ("sent" as const), // Ensure type inference
    user: t.toUserId === userId ? t.fromUser.name : t.toUser.name,
    
    }));
}

export default async function () {
  const balance = await getBalance(); // Get the balance with locked amount
  const transactionsP2P = await getP2PTransaction(); // Get the user's P2P transactions

  return (
    <div className="w-screen">
      <div className="text-4xl mt-10 text-[#508291] pt-8 mb-8 font-bold">
        P2P Transfer
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
        <div>
          <SendCard />
        </div>
        <div>
          <BalanceCard amount={balance.amount} locked={balance.locked} />
          <div className="pt-4">
            <P2PTransaction transactions={transactionsP2P} />
          </div>
        </div>
      </div>
    </div>
  );
}
