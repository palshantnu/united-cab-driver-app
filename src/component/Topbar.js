import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons';
const Topbar = ({ title, navigation }) => {
    return (
        <View style={styles.topbar}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.topbarTitle}>{title}</Text>
            <View style={{ width: 24 }} />
        </View>
    )
}

export default Topbar

const styles = StyleSheet.create({
    topbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 10,
    },
    topbarTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
})