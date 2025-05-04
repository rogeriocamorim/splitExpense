import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import { Expense } from "../utils/balanceCalculator";

interface Props {
    person: string;
    expenses: Expense[];
    onClose: () => void;
}

export default function PersonReportDialog({ person, expenses, onClose }: Props) {
    const groupedByPayer = expenses
        .filter(e => e.split_between.includes(person) && e.paid_by !== person)
        .reduce<Record<string, Expense[]>>((acc, expense) => {
            if (!acc[expense.paid_by]) acc[expense.paid_by] = [];
            acc[expense.paid_by].push(expense);
            return acc;
        }, {});

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{person}'s Expense Report</DialogTitle>
            <DialogContent>
                {Object.entries(groupedByPayer).map(([payer, exps]) => (
                    <Box key={payer} mb={4}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {person} owes {payer}
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell align="right">Share</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {exps.map((e, i) => (
                                    <TableRow key={i}>
                                        <TableCell>{e.date}</TableCell>
                                        <TableCell>{e.description}</TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(e.amount)}
                                        </TableCell>
                                        <TableCell align="right">
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                                signDisplay: "always"
                                            }).format(e.amount / e.split_between.length)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                <TableRow>
                                    <TableCell colSpan={3} align="right">
                                        <strong>Total</strong>
                                    </TableCell>
                                    <TableCell align="right">
                                        <strong>
                                            {new Intl.NumberFormat("en-US", {
                                                style: "currency",
                                                currency: "USD",
                                            }).format(
                                                exps.reduce((sum, e) => sum + e.amount / e.split_between.length, 0)
                                            )}
                                        </strong>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </Box>
                ))}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
