import { ThemedText } from '@/components/ThemedText';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

type Mark = 'X' | 'O' | null;

const { width: screenWidth } = Dimensions.get('window');

function checkWinner(cells: Mark[]): Mark | 'draw' | null {
    const patterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    for (let line of patterns) {
        const [a, b, c] = line;
        if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
            return cells[a];
        }
    }

    if (cells.every(val => val)) return 'draw';
    return null;
}

// Minimax algorithm
function minimax(board: Mark[], depth: number, isCPU: boolean, alpha: number, beta: number): number {
    const result = checkWinner(board);
    if (result === 'O') return 10 - depth;
    if (result === 'X') return depth - 10;
    if (result === 'draw') return 0;

    const moves = board
        .map((val, i) => (val === null ? i : -1))
        .filter(i => i !== -1);

    if (isCPU) {
        let maxEval = -Infinity;
        for (let move of moves) {
            board[move] = 'O';
            const score = minimax(board, depth + 1, false, alpha, beta);
            board[move] = null;
            maxEval = Math.max(maxEval, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            board[move] = 'X';
            const score = minimax(board, depth + 1, true, alpha, beta);
            board[move] = null;
            minEval = Math.min(minEval, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

// Get the best move for the computer
function getBestMove(currentBoard: Mark[]): number {
    let topScore = -Infinity;
    let bestMove = 0;
    const candidates = currentBoard.map((v, i) => v === null ? i : -1).filter(i => i !== -1);

    for (let i of candidates) {
        currentBoard[i] = 'O';
        const score = minimax(currentBoard, 0, false, -Infinity, Infinity);
        currentBoard[i] = null;
        if (score > topScore) {
            topScore = score;
            bestMove = i;
        }
    }

    return bestMove;
}

export default function GameHome() {
    const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
    const [xTurn, setXTurn] = useState(true);
    const [versusBot, setVersusBot] = useState(true);
    const [bounceAnims] = useState(() => Array(9).fill(0).map(() => new Animated.Value(0)));
    const [statusFade] = useState(new Animated.Value(1));

    const winner = checkWinner(board);

    useEffect(() => {
        if (versusBot && !xTurn && !winner && board.includes(null)) {
            const delay = setTimeout(() => {
                const botMove = getBestMove([...board]);
                const updated = [...board];
                updated[botMove] = 'O';
                setBoard(updated);
                setXTurn(true);

                Animated.spring(bounceAnims[botMove], {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 100,
                    friction: 8,
                }).start();
            }, 800);

            return () => clearTimeout(delay);
        }
    }, [xTurn, board, versusBot, winner, bounceAnims]);

    useEffect(() => {
        Animated.sequence([
            Animated.timing(statusFade, {
                toValue: 0.7,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(statusFade, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    }, [winner, xTurn, statusFade]);

    function handleMove(index: number) {
        if (board[index] || winner) return;
        if (versusBot && !xTurn) return;

        const next = [...board];
        next[index] = xTurn ? 'X' : 'O';
        setBoard(next);
        setXTurn(prev => !prev);

        Animated.spring(bounceAnims[index], {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
        }).start();
    }

    function restartGame() {
        setBoard(Array(9).fill(null));
        setXTurn(true);
        bounceAnims.forEach(anim => anim.setValue(0));
    }

    function switchMode() {
        setVersusBot(prev => !prev);
        restartGame();
    }

    let statusMsg = '';
    let statusClr = '#007AFF';

    if (winner === 'draw') {
        statusMsg = "It's a draw!";
        statusClr = '#FF9500';
    } else if (winner) {
        statusMsg = `Winner: ${winner}`;
        statusClr = winner === 'X' ? '#34C759' : '#FF3B30';
    } else {
        statusMsg = `Next: ${xTurn ? 'X' : 'O'}`;
        statusClr = xTurn ? '#34C759' : '#FF3B30';
    }

    return (
        <LinearGradient
            colors={['#1a1a2e', '#16213e', '#0f3460']}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <ThemedText type="title" style={styles.title}>
                        Tic Tac Toe
                    </ThemedText>
                    <Animated.View style={{ opacity: statusFade }}>
                        <ThemedText style={[styles.status, { color: statusClr }]}>
                            {statusMsg}
                        </ThemedText>
                    </Animated.View>
                    <View style={styles.modeIndicator}>
                        <View style={[styles.modeDot, { backgroundColor: versusBot ? '#34C759' : '#FF9500' }]} />
                        <ThemedText style={styles.modeText}>
                            {versusBot ? 'vs Computer' : 'vs Human'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.boardContainer}>
                    <View style={styles.board}>
                        {board.map((val, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.cellWrapper,
                                    {
                                        transform: [{
                                            scale: bounceAnims[i].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.1],
                                            }),
                                        }],
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.cell,
                                        (i % 3 !== 2) && styles.cellRightBorder,
                                        (i < 6) && styles.cellBottomBorder,
                                    ]}
                                    onPress={() => handleMove(i)}
                                    activeOpacity={0.8}
                                >
                                    <ThemedText style={[
                                        styles.cellText,
                                        val === 'X' && styles.xText,
                                        val === 'O' && styles.oText,
                                    ]}>
                                        {val}
                                    </ThemedText>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.modeButton}
                        onPress={switchMode}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#007AFF', '#5856D6']}
                            style={styles.buttonGradient}
                        >
                            <ThemedText style={styles.buttonText}>
                                {versusBot ? '2 Player Mode' : 'Computer Mode'}
                            </ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>

                    {(winner || winner === 'draw') && (
                        <TouchableOpacity
                            style={styles.resetButton}
                            onPress={restartGame}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#FF9500', '#FF6B35']}
                                style={styles.buttonGradient}
                            >
                                <ThemedText style={styles.buttonText}>New Game</ThemedText>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </LinearGradient>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        width: 500,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    status: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    modeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    modeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    boardContainer: {
        marginBottom: 40,
    },
    board: {
        width: Math.min(screenWidth - 80, 300),
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    cellWrapper: {
        flex: 1,
        minWidth: 80,
        minHeight: 80,
    },
    cell: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        margin: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cellRightBorder: {
        borderRightWidth: 0,
        borderRightColor: 'rgba(255, 255, 255, 0.2)',
    },
    cellBottomBorder: {
        borderBottomWidth: 0,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    cellText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    xText: {
        color: '#34C759',
        textShadowColor: 'rgba(52, 199, 89, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    oText: {
        color: '#FF3B30',
        textShadowColor: 'rgba(255, 59, 48, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    modeButton: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    resetButton: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
        textAlign: 'center',
    },
});
