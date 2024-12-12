import prisma from "@repo/db/client";
import React from "react";
import { authOptions } from "../app/lib/auth";
import { getServerSession } from "next-auth";
import { P2PTransaction } from "./P2PTransaction";

// Fetch P2P transactions involving the logged-in user
async function getP2PTransaction() {
  const session = await getServerSession(authOptions);
  const userId = Number(session?.user?.id);

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
    direction: t.toUserId === userId ? "received" : "sent",
    user: t.toUserId === userId ? t.fromUser.name : t.toUser.name,
  }));
}

async function Dashboard() {
  const session = await getServerSession(authOptions);

  // Capitalize first letter of the user's name
  function capitalizeFirstLetter(name: any) {
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "User";
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(session?.user?.id) },
    select: { name: true },
  });

  const userName = capitalizeFirstLetter(user?.name);

  // Fetch dashboard stats
  const [userCount, balanceInfo, recentTransfers, onRampTransactions] = await Promise.all([
    prisma.user.count(),
    prisma.balance.findUnique({
      where: { userId: Number(session?.user?.id) },
      select: { amount: true, locked: true },
    }),
    prisma.p2pTransfer.findMany({
      where: { OR: [{ fromUserId: Number(session?.user?.id) }, { toUserId: Number(session?.user?.id) }] },
      orderBy: { timestamp: "desc" },
    }),
    prisma.onRampTransaction.findMany({
      where: { userId: Number(session?.user?.id) },
      orderBy: { startTime: "desc" },
    }),
  ]);

  // Fetch all processing onRamp transactions for locked balance calculation
  const processingTransactions = await prisma.onRampTransaction.findMany({
    where: {
      userId: Number(session?.user?.id),
      status: "Processing",
    },
  });

  // Calculate the locked amount (sum of all processing transaction amounts)
  const lockedAmount = processingTransactions.reduce(
    (total, txn) => total + txn.amount,
    0
  );
  const transactionp2p = await getP2PTransaction();

  // Format balance and locked amounts
  const balanceAmount = (balanceInfo?.amount || 0) / 100;
  const lockedAmountFormatted = lockedAmount / 100;

  return (
    <div className="min-h-screen  py-10">
      {/* Header Section */}
      <header className="flex justify-between items-center pb-8 border-b">
        <div>
          <h1 className="text-4xl  mt-10 text-[#508291] font-bold">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">Welcome back, {userName}!</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Total Users</h2>
            <p className="text-3xl font-bold text-[#508291] mt-2">{userCount}</p>
          </div>

          <div className="p-6 bg-white rounded shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Total Balance</h2>
            <p className="text-3xl font-bold text-[#508291] mt-2">₹{balanceAmount}</p>
          </div>
          <div className="p-6 bg-white rounded shadow-md">
            <h2 className="text-xl font-semibold text-gray-700">Locked Balance</h2>
            <p className="text-3xl font-bold text-[#508291] mt-2">₹{lockedAmountFormatted}</p>
          </div>

          <div className="lg:col-span-4 mr-2 p-6 bg-white rounded shadow-md">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-4">P2P Transfers</h2>
            <P2PTransaction transactions={transactionp2p} />
          </div>
        </div>

        {/* OnRamp Transactions */}
        <div className="lg:col-span-1 mr-3 p-6 bg-white rounded shadow-md">
  <h2 className="text-xl font-semibold text-gray-700 border-b pb-4">Bank Transfer</h2>
  <ul className="mt-4 space-y-4">
    {onRampTransactions.length === 0 ? (
      <p className="">No recent transactions .</p>
    ) : (
      onRampTransactions.map((transaction) => (
        <li key={transaction.id} className="flex items-start">
          <span
            className={`block w-2.5 h-2.5 rounded-full mt-1.5 ${
              transaction.status === "Success"
                ? "bg-green-500"
                : transaction.status === "Failure"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          ></span>
          <p className="ml-4 text-gray-600">
            {transaction.status} - ₹{transaction.amount / 100} via {transaction.provider} on{" "}
            {new Date(transaction.startTime).toLocaleDateString()}
          </p>
        </li>
      ))
    )}
  </ul>
</div>
      </main>

      {/* Footer Section */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </footer>
    </div>
  );
}

export default Dashboard;
