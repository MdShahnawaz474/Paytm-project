"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {
    if (!to || typeof to !== "string" || !amount || typeof amount !== "number" || amount <= 0) {
        return { message: "Invalid input data" };
    }

    const session = await getServerSession(authOptions);
    const from = session?.user?.id;

    if (!from) {
        return { message: "Authentication failed" };
    }

    try {
        const toUser = await prisma.user.findUnique({
            where: { number: to }
        });

        if (!toUser) {
            return { message: "User not found" };
        }

        await prisma.$transaction(async (tx) => {
            // Lock sender's balance
            await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;
            
            const fromBalance = await tx.balance.findUnique({
                where: { userId: Number(from) }
            });

            if (!fromBalance || fromBalance.amount < amount) {
                throw new Error("Insufficient funds");
            }

            // Deduct amount from sender
            await tx.balance.update({
                where: { userId: Number(from) },
                data: { amount: { decrement: amount } }
            });

            // Add transfer record
            await tx.p2pTransfer.create({
                data: {
                    fromUserId: Number(from),
                    toUserId: toUser.id,
                    amount,
                    timestamp: new Date()
                }
            });
        });

        return { message: "Transfer successful" };
    } catch (error: any) {
        console.error("P2P Transfer Error:", error.message);
        return { message: error.message || "Transfer failed" };
    }
}
