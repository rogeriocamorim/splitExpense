import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Paper,
    Button,
    Box,
} from "@mui/material";
import { useState } from "react";
import { Expense } from "../utils/balanceCalculator";

interface Props {
    expenses: Expense[];
}

export default function ExpenseTable({ expenses }: Props) {
    const [showAll, setShowAll] = useState(false);

    if (expenses.length === 0) {
        return (
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 4, textAlign: "center" }}
            >
                No expenses recorded yet.
            </Typography>
        );
    }

    const displayed = showAll ? expenses : expenses.slice(0, 5);

    return (
        <Box>
            <TableContainer component={Paper} sx={{ mt: 6 }}>
                <Table size="small" aria-label="expense table">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="right"><strong>Amount</strong></TableCell>
                            <TableCell><strong>Paid By</strong></TableCell>
                            <TableCell><strong>Split Between</strong></TableCell>
                            <TableCell align="right"><strong>Per Person</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayed.map((exp, idx) => {
                            const perPerson = exp.amount / exp.split_between.length;
                            return (
                                <TableRow key={idx}>
                                    <TableCell>{exp.date}</TableCell>
                                    <TableCell>{exp.description}</TableCell>
                                    <TableCell align="right">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        }).format(exp.amount)}
                                    </TableCell>
                                    <TableCell>{exp.paid_by}</TableCell>
                                    <TableCell>{exp.split_between.join(", ")}</TableCell>
                                    <TableCell align="right">
                                        {new Intl.NumberFormat("en-US", {
                                            style: "currency",
                                            currency: "USD",
                                        }).format(perPerson)}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {expenses.length > 5 && (
                <Box textAlign="center" mt={2}>
                    <Button size="small" onClick={() => setShowAll((prev) => !prev)}>
                        {showAll ? "Show Less" : `Show All (${expenses.length})`}
                    </Button>
                </Box>
            )}
        </Box>
    );
}