import { useState, useEffect } from "react";
import {
    Typography,
    TextField,
    Button,
    Stack,
    Paper,
    Box,
    Collapse,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { calculateBalances, BalancesMap, Expense } from "./utils/balanceCalculator";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseTable from "./components/ExpenseTable";
import BalanceSummary from "./components/BalanceSummary";

export default function App() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [balances, setBalances] = useState<BalancesMap>({});
    const [members, setMembers] = useState<string[]>([]);
    const [newMember, setNewMember] = useState("");

    const [showExpenseForm, setShowExpenseForm] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);

    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [showAuthDialog, setShowAuthDialog] = useState(true);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [isLogin, setIsLogin] = useState(true);

    useEffect(() => {
        if (!token) return;
        fetch("http://localhost:3001/expenses", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => setExpenses(data))
            .catch((err) => console.error("Failed to load expenses from server:", err));
    }, [token]);

    useEffect(() => {
        setBalances(calculateBalances(expenses));
        const deduped = Array.from(new Set(expenses.flatMap((e) => [e.paid_by, ...e.split_between])));
        setMembers((prev) => Array.from(new Set([...prev, ...deduped])).sort());
    }, [expenses]);

    const handleAddExpense = async (expense: Expense) => {
        setExpenses((prev) => [...prev, expense]);
        try {
            await fetch("http://localhost:3001/add-expense", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(expense),
            });
        } catch (error) {
            console.error("Failed to save expense to server:", error);
        }
    };

    const handleAddMember = () => {
        const trimmed = newMember.trim();
        if (trimmed && !members.includes(trimmed)) {
            setMembers([...members, trimmed].sort());
            setNewMember("");
        }
    };

    const canRemoveMember = (name: string): boolean => {
        return !expenses.some((exp) => exp.paid_by === name || exp.split_between.includes(name));
    };

    const handleRemoveMember = (name: string) => {
        if (canRemoveMember(name)) {
            setMembers((prev) => prev.filter((m) => m !== name));
        }
    };

    const handleAuth = async () => {
        const endpoint = isLogin ? "login" : "register";
        try {
            const res = await fetch(`http://localhost:3001/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail, password: authPassword }),
            });
            if (!res.ok) throw new Error("Failed to authenticate");
            const data = await res.json();
            setToken(data.token);
            setUserEmail(authEmail);
            setShowAuthDialog(false);
        } catch (err) {
            console.log(err);
            setIsLogin(false);
            alert("Authentication failed. Check credentials or try again.");
        }
    };

    const handleLogout = () => {
        setToken(null);
        setUserEmail(null);
        setShowAuthDialog(true);
        setExpenses([]);
    };

    return (
        <Box sx={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "flex-start", pt: 6, px: 2, overflowY: "auto" }}>
            <Box sx={{ maxWidth: 1200, width: "100%" }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h4">💸 Split Expense Tracker</Typography>
                    <Stack direction="row" spacing={1}>
                        {token && (
                            <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
                        )}
                        <Button variant="outlined" onClick={() => setShowMembersModal(true)}>
                            Manage Members
                        </Button>
                    </Stack>
                </Stack>

                {members.length > 0 && (
                    <Stack direction={{ xs: "column", md: "row" }} spacing={3} mb={4}>
                        <Paper sx={{ flex: 1, p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Add a New Expense</Typography>
                                <IconButton onClick={() => setShowExpenseForm((prev) => !prev)}>
                                    {showExpenseForm ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Stack>
                            <Collapse in={showExpenseForm}>
                                <ExpenseForm onAddExpense={handleAddExpense} members={members} setMembers={setMembers} />
                            </Collapse>
                        </Paper>
                        <Stack flex={1} spacing={3}>
                            <ExpenseTable expenses={expenses} />
                            <BalanceSummary expenses={expenses} />
                        </Stack>
                    </Stack>
                )}

                <Dialog open={showMembersModal} onClose={() => setShowMembersModal(false)} fullWidth maxWidth="sm">
                    <DialogTitle>Trip Members</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <TextField
                                label="Add member"
                                value={newMember}
                                onChange={(e) => setNewMember(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddMember();
                                    }
                                }}
                                placeholder="e.g. Rogerio"
                                fullWidth
                            />
                            {members.length > 0 && (
                                <Stack spacing={1}>
                                    {members.map((member) => {
                                        const removable = canRemoveMember(member);
                                        return (
                                            <Stack key={member} direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography>{member}</Typography>
                                                <Button size="small" variant="outlined" color="error" disabled={!removable} onClick={() => handleRemoveMember(member)}>
                                                    Remove
                                                </Button>
                                            </Stack>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setShowMembersModal(false)}>Close</Button>
                        <Button variant="contained" onClick={handleAddMember}>Add</Button>
                    </DialogActions>
                </Dialog>

                {!token && (
                    <Dialog open={showAuthDialog} disableEscapeKeyDown fullWidth maxWidth="xs">
                        <DialogTitle>{isLogin ? "Login" : "Create Account"}</DialogTitle>
                        <DialogContent>
                            <Stack spacing={2} mt={1}>
                                <TextField
                                    label="Email"
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Password"
                                    type="password"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    fullWidth
                                />
                                <Button variant="contained" onClick={handleAuth}>
                                    {isLogin ? "Login" : "Register"}
                                </Button>
                                <Button onClick={() => setIsLogin((prev) => !prev)} size="small">
                                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                                </Button>
                            </Stack>
                        </DialogContent>
                    </Dialog>
                )}
            </Box>
        </Box>
    );
}
