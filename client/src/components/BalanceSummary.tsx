import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Paper,
    Divider,
    Button,
} from "@mui/material";
import { useState } from "react";
import { Expense } from "../utils/balanceCalculator";
import PersonReportDialog from "./PersonReportDialog";

interface Props {
    expenses: Expense[];
}

interface Contribution {
    from: string;
    to: string;
    amount: number;
    date: string;
}

interface BreakdownEntry {
    amount: number;
    reversed: boolean;
}

export default function BalanceSummary({ expenses }: Props) {
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);

    const contributions: Contribution[] = [];

    for (const exp of expenses) {
        const share = exp.amount / exp.split_between.length;
        for (const person of exp.split_between) {
            if (person === exp.paid_by) continue;
            contributions.push({
                from: person,
                to: exp.paid_by,
                amount: share,
                date: exp.date,
            });
        }
    }

    const pairMap = new Map<
        string,
        {
            total: number;
            breakdown: BreakdownEntry[];
            dates: string[];
            a: string;
            b: string;
        }
    >();

    for (const c of contributions) {
        const [a, b] = [c.from, c.to].sort();
        const key = `${a}↔${b}`;
        const reversed = c.from > c.to;

        if (!pairMap.has(key)) {
            pairMap.set(key, {
                total: 0,
                breakdown: [],
                dates: [],
                a,
                b,
            });
        }

        const entry = pairMap.get(key)!;
        const signedAmount = reversed ? -c.amount : c.amount;

        entry.total += signedAmount;
        entry.breakdown.push({ amount: c.amount, reversed });
        entry.dates.push(c.date);
    }

    const rows = Array.from(pairMap.values())
        .filter((entry) => entry.total !== 0)
        .map((entry) => {
            const isReversed = entry.total < 0;
            const from = isReversed ? entry.b : entry.a;
            const to = isReversed ? entry.a : entry.b;

            const breakdown = entry.breakdown.map((line) => {
                const flip = line.reversed !== isReversed;
                return `${flip ? "+" : "-"}${line.amount.toFixed(2)}`;
            });

            return {
                from,
                to,
                total: Math.abs(entry.total),
                breakdown,
                dates: entry.dates,
            };
        })
        .sort((a, b) => {
            const latestA = Math.max(...a.dates.map((d) => new Date(d).getTime()));
            const latestB = Math.max(...b.dates.map((d) => new Date(d).getTime()));
            return latestB - latestA;
        });

    if (rows.length === 0) {
        return (
            <Box mt={4} textAlign="center">
                <Typography variant="h6" color="text.secondary">
                    All settled up! 🎉
                </Typography>
            </Box>
        );
    }

    return (
        <Box mt={5}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Final Balance Summary
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <List>
                    {rows.map((row) => (
                        <ListItem key={`${row.from}->${row.to}`} sx={{ px: 0 }}>
                            <ListItemText
                                primary={
                                    <>
                                        {`${row.from} owes ${row.to}: ${row.total.toLocaleString("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        })}`}
                                        <Button size="small" sx={{ ml: 2 }} onClick={() => setSelectedPerson(row.from)}>
                                            View Report
                                        </Button>
                                    </>
                                }
                                secondary={`Breakdown: ${row.breakdown.join(" ")}`}
                                slotProps={{
                                    primary: { sx: { fontWeight: "medium" } },
                                    secondary: { sx: { color: "text.secondary" } },
                                }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {selectedPerson && (
                <PersonReportDialog
                    person={selectedPerson}
                    expenses={expenses}
                    onClose={() => setSelectedPerson(null)}
                />
            )}
        </Box>
    );
}