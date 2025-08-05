import { ThemedView } from '@/components/ThemedView';
import GameHome from '@/screenComponents/game-home/gameHome';
import { StyleSheet } from 'react-native';

export default function Game() {
    return (
        <ThemedView style={styles.container}>
            <GameHome />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
});
