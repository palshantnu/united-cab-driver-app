import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image, TextInput, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import useTheme from '../theme/useTheme';
import { Color } from '../theme';


const CustomDropdownComponent = ({
    onSelect,
    Title = "",
    editable = false,
    placeholder = "Select an option",
    countryData = [], // This should now be your `items2` array
    selectedCountryData = "",
    errorMessage,
    containerStyle,
}) => {

    const [isError, setIsError] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(selectedCountryData || null);
    const [currentModal, setCurrentModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSelection = (type, item) => {
        if (item) {
            setIsError(false);
            setSelectedCountry(item);
            onSelect?.(item);
            setCurrentModal(null);
        } else {
            setIsError(true);
        }
    };

    const openModal = (type) => {
        if (editable) setCurrentModal(type);
    };

    const renderModalContent = (data, onSelect, type) => {
        const filteredData = data.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <>
                <TextInput
                    placeholder="Search country"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    placeholderTextColor="#888"
                />
                <FlatList
                    data={filteredData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(type, item)}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.modalText}>{item.emoji} {' '}{item.name}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </>
        );
    };


    return (
        <>

            <View style={[styles.container, { borderColor: isError ? '#ccc' : '#ccc' }, containerStyle]}>
                <TouchableOpacity
                    activeOpacity={editable ? .7 : 1}
                    style={styles.dropdown}
                    onPress={() => editable && openModal('country')}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>

                            <Text style={[
                                styles.dropdownText,
                                { color: selectedCountry ? Color.black : Color.black, fontSize: 22, marginLeft: 20 }
                            ]}>
                                {selectedCountry ? selectedCountry.emoji : null}
                            </Text>
                        </View>
                        {editable && <Icon name="caret-down-sharp" size={12} color={Color.black} />}
                    </View>
                </TouchableOpacity>
            </View>

            {isError && errorMessage && (
                <Text style={styles.errorText}>{errorMessage}</Text>
            )}

            <Modal visible={currentModal === 'country'} transparent animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{Title}</Text>
                        {renderModalContent(countryData, handleSelection, 'country')}
                        <TouchableOpacity onPress={() => setCurrentModal(null)} style={styles.modalCloseButton}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};
const { height: screenHeight } = Dimensions.get('window');
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        height: 48,
        // paddingHorizontal: 10,
        backgroundColor: 'white',
        // marginVertical: 10,
    },
    dropdown: {
        flex: 1,
        justifyContent: 'center',
        height: '100%',
        // marginHorizontal: 12
    },
    dropdownText: {
        fontSize: 14,
        fontFamily: "Figtree-Regular",
    },
    emoji: {
        fontSize: 20,
    },
    flagImage: {
        width: 24,
        height: 16,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 16,
        marginTop: 8,
        fontFamily: "Figtree-Regular",
        alignSelf: "flex-start",
        fontWeight: '500'
    },
    errorText: {
        color: '#ED7063',
        fontSize: 11,
        marginTop: -5,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        height: screenHeight * 0.8
    },
    modalContent: {
        width: '90%',
        height: screenHeight * 0.8,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        alignSelf: "center",
        fontSize: 18,
        fontFamily: "Figtree-Medium",
        marginBottom: 15,
        color: "#141B34"
    },
    modalItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalText: {
        fontSize: 14,
        fontFamily: "Figtree-Regular",
        marginLeft: 10,
        color: "#141B34"
    },
    modalCloseButton: {
        marginTop: 15,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#007BFF',
        fontSize: 16,
        fontFamily: "Figtree-Regular",
    },
    searchInput: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 10,
        fontFamily: "Figtree-Regular",
        fontSize: 14,
        color: '#000',
    },
});

export default CustomDropdownComponent;
