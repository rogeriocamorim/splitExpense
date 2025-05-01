export interface Expense {
    date: string;
    description: string;
    amount: number;
    paid_by: string;
    split_between: string[];
}

export type BalancesMap = Record<string, Record<string, number>>;

export function calculateBalances(expenses: Expense[]): BalancesMap {
    const raw: BalancesMap = {};

    for (const expense of expenses) {
        const splitCount = expense.split_between.length;
        const share = expense.amount / splitCount;

        for (const person of expense.split_between) {
            if (person === expense.paid_by) continue;

            if (!raw[person]) raw[person] = {};
            if (!raw[person][expense.paid_by]) raw[person][expense.paid_by] = 0;

            raw[person][expense.paid_by] += share;
        }
    }

    return netBalances(raw);
}

function netBalances(input: BalancesMap): BalancesMap {
    const net: BalancesMap = {};
    const people = new Set([
        ...Object.keys(input),
        ...Object.values(input).flatMap(obj => Object.keys(obj)),
    ]);

    for (const personA of people) {
        for (const personB of people) {
            if (personA === personB) continue;

            const owesAtoB = input[personA]?.[personB] || 0;
            const owesBtoA = input[personB]?.[personA] || 0;
            const netOwes = owesAtoB - owesBtoA;

            if (netOwes > 0) {
                if (!net[personA]) net[personA] = {};
                net[personA][personB] = parseFloat(netOwes.toFixed(2));
            }
        }
    }

    return net;
}
