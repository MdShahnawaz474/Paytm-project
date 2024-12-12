import { Card } from "@repo/ui/card"

export const OnRampTransactions = ({
    transactions
}: {
    transactions: {
        time: Date,
        amount: number,
        status: string, // Can be 'Success', 'Failure', or 'Processing'
        provider: string
    }[]
}) => {
    if (!transactions.length) {
        return <Card title="Recent Transactions">
            <div className="text-center pb-8 pt-8">
                No Recent transactions
            </div>
        </Card>
    }
    const sortedTransactions = [...transactions].sort((a, b) => b.time.getTime() - a.time.getTime());

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }; 
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Success':
                return 'text-green-600';
            case 'Failure':
                return 'text-red-600';
            case 'Processing':
                return 'text-yellow-600';
            default:
                return 'text-gray-600';
        }
    };
    return  <Card title="Recent Transactions">
    <div className="pt-2">
        {sortedTransactions.map((t, index) => (
            <div key={index} className="flex justify-between py-3 border-b last:border-b-0">
                <div>
                    <div className="text-sm">
                        Received INR
                    </div>
                    <div className="text-slate-600 text-xs">
                        {formatDate(t.time)}
                    </div>
                </div>
                <div className="flex flex-col justify-center text-right">
                    <div className={getStatusColor(t.status)}>
                        {t.status}
                    </div>
                    <div className="font-bold">
                        + Rs {t.amount / 100}
                    </div>
                </div>
            </div>
        ))}
    </div>
</Card>
}