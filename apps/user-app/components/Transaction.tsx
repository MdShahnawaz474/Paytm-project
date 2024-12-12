import { getServerSession } from "next-auth";
import React from "react";
import { authOptions } from "../app/lib/auth";
import prisma from "@repo/db/client";
import { SendCard } from "./SendCard";
import { BalanceCard } from "./BalanceCard";
import { P2PTransaction } from "./P2PTransaction";
import { OnRampTransactions } from "./OnRampTransactions";

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
      status: "Processing",
    },
  });

  // Calculate the total amount of processing transactions (locked amount)
  const lockedAmount = processingTransactions.reduce(
    (total, txn) => total + txn.amount,
    0
  );

  // Return balance with locked amount calculated
  return {
    amount: balance.amount - lockedAmount, // Available balance
    locked: lockedAmount, // Total locked amount from processing transactions
  };
}

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
    direction:
      t.toUserId === userId ? ("received" as const) : ("sent" as const), // Ensure type inference
    user: t.toUserId === userId ? t.fromUser.name : t.toUser.name,
  }));
}

async function getOnRampTransactions() {
  const session = await getServerSession(authOptions);

  // Fetch the transactions for the logged-in user
  const txns = await prisma.onRampTransaction.findMany({
    where: {
      userId: Number(session?.user?.id),
    },
  });

  // Map through transactions and return required details
  return txns.map((t) => ({
    time: t.startTime,
    amount: t.amount,
    status: t.status,
    provider: t.provider,
  }));
}
const Transaction = async () => {
    const transactionsP2P = await getP2PTransaction();
    const transactions = await getOnRampTransactions(); // Get all user transactions
  
    return ( <div className=" m-7 mt-16">
      <div className="text-4xl text-[#508291] font-bold grid grid-cols-2 gap-4 md:grid-cols-2  mt-10  ">
        Transactions
    </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-2 p-4 ml-14 ">
        {/* P2P Transactions Section */}
      
        <div className="p-4 pr-1 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            P2P Transactions
          </h2>
          <P2PTransaction transactions={transactionsP2P} />
        </div>
  
        {/* OnRamp Transactions Section */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            Account Transactions
          </h2>
          <OnRampTransactions transactions={transactions} />
        </div>
      </div>
      </div>
      
       
    );
  };
  
  export default Transaction;
  
