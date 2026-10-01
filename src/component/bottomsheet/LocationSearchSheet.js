// components/LocationSearchSheet.js
import React, { useRef } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Color } from '../../theme';

const sampleSuggestions = ['Office', 'Home', 'Airport', 'Train Station', 'Mall'];

const LocationSearchSheet = ({ sheetRef, onSelect }) => {
  const handleSelect = (location) => {
    onSelect(location);
    sheetRef.current?.close();
  };

  return (
    <RBSheet
      ref={sheetRef}
      height={400}
      openDuration={250}
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 16,
        },
      }}
    >
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color={Color.apptheme} />
        <TextInput
          placeholder="Search location..."
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>
      <FlatList
        data={sampleSuggestions}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.itemText}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </RBSheet>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    paddingVertical: 10,
    color: '#333',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
});

export default LocationSearchSheet;
