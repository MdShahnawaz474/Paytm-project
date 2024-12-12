import { Card } from "@repo/ui/card";

export const P2PTransaction = ({
    transactions,
}: {
    transactions: {
        id: number;
        time: Date;
        amount: number;
        direction: string|"sent" | "received";
        user: string | null;
        
    }[];
}) => {
    if (!transactions.length) {
        return (
            <Card title="Recent Transactions">
                <div className="text-center py-8">No Recent Transactions</div>
            </Card>
        );
    }

    return (
        <Card title="Recent Transactions">
         
            <div className="pt-2  space-y-4">
                {transactions.map((t) => (
                    <div
                        key={t.id}
                        className="flex justify-between items-center border-b pb-2 last:border-none"
                    >
                        <div>
                            <div className="text-sm font-medium">
                                {t.direction === "received" ? "Received from" : "Sent to"} {t.user || "Unknown"}

                            </div>
                            <div className="text-slate-600 text-xs">
                                {new Date(t.time).toLocaleString()}
                            </div>
                        </div>
                        <div
                            className={
                                t.direction === "received"
                                    ? "text-green-500 font-semibold"
                                    : "text-red-500 font-semibold"
                            }
                        >
                            {t.direction === "received" ? "+" : "-"} ₹{(t.amount / 100).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>
            
        </Card>
    );
};