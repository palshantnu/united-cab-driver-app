import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Platform,
    ScrollView
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Color } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useDispatch, useSelector } from 'react-redux';
import { getData, postData, postDataAndImage } from '../../API';
import { t } from 'i18next';
import { CustomToast } from '../../component/ToastConfig';
import ImagePicker from 'react-native-image-crop-picker';



const ProfileScreen = () => {
    const navigation = useNavigation(); // Initialize navigation
    const [editMode, setEditMode] = useState(false);
    const dispatch = useDispatch();

    const user = useSelector(state => state.user);
    const vehicalType = useSelector(state => state.vehicalType);
    const userdetails = useSelector(state => state.userdetails);
    const [genderDropdownOpen, setGenderDropdownOpen] = useState(false);


    const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
    const [vehicleType, setVehicleType] = useState(null);
    const [vehicleTypes, setVehicleTypes] = useState(vehicalType);
    const [profile, setProfile] = useState(userdetails);
    console.log(profile);
    const [imageUri, setImageUri] = useState(profile.profile_image);
    const getVehicalType = async () => {
        const res = await getData('vehicle-types');
        const formattedData = res.vehicle_types.map(item => ({
            label: item.type_name,
            value: item.id.toString(), // Use string if DropDownPicker expects string
        }));
        dispatch({
            type: 'SET_VEHICALTYPE',
            payload: formattedData,
        });

    }
    const getProfile = async () => {
        const body = {
            driver_id: user.id

        }
        const res = await postData('driver-profile', body);
        console.log('res==>', res);
        dispatch({
            type: 'SET_USERDETAILS',
            payload: res.profile,
        });
    }

    const updateProfile = async () => {
        const formData = new FormData();

        formData.append('driver_id', user.id);
        formData.append('name', profile.name);
        formData.append('phone', profile.phone);
        formData.append('gender', profile.gender || 'male');
        formData.append('vehicle_id', parseInt(vehicleType));
        formData.append('vehicle_number', profile.vehicle_number);
        formData.append('vehicle_model', profile.vehicle_model);

        if (imageUri && !imageUri.startsWith('http')) {
            const filename = imageUri.split('/').pop();
            const ext = filename.split('.').pop();
            const mimeType = `image/${ext}`;

            formData.append('profile_photo', {
                uri: imageUri,
                type: mimeType,
                name: filename
            });
        }
         console.log(formData);

        try {
            const res = await postDataAndImage('driver_profile_update', formData, true); // assume third param sets multipart
            if (res.message === 'Driver profile updated successfully') {
                CustomToast.show('Your Profile Updated Successfully');
                getProfile();
                setEditMode(false);
            }
        } catch (error) {
            console.error('Update failed:', error);
        }
    };


    const pickImage = () => {
        ImagePicker.openPicker({
            width: 300,
            height: 300,
            cropping: true,
            mediaType: 'photo'
        }).then(image => {
            console.log('Selected Image:', image);
            setImageUri(image.path);
        }).catch(e => {
            console.log('Image picking cancelled or failed:', e);
        });
    };
    useEffect(() => {
        getVehicalType();
        getProfile();
    }, [])


    // Simulated API response (you should replace with real API call)
    useEffect(() => {
        if (userdetails?.vehicle_id) {
            setVehicleType(userdetails.vehicle_id.toString());
        } if (userdetails) {
            setProfile(userdetails); // ← This line is crucial
        }
    }, [userdetails]);




    const handleChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };
    console.log('profile', profile);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back-outline" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerText}> Driver Profile</Text>
                <TouchableOpacity onPress={() => setEditMode(!editMode)}>
                    <Ionicons
                        name={editMode ? 'checkmark-done-outline' : 'create-outline'}
                        size={24}
                        color="#000"
                    />
                </TouchableOpacity>
            </View>


            <ScrollView contentContainerStyle={styles.content}>
                <TouchableOpacity onPress={editMode ? pickImage : null}>
                    <Image
                        source={
                            imageUri
                                ? { uri: imageUri }
                                : profile.profile_photo
                                    ? { uri: `https://unitedcabsmerthyr.uk/${profile.profile_photo}` }
                                    : { uri: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png' }
                        }
                        style={styles.profileImage}
                    />

                </TouchableOpacity>

                <View style={styles.card}>
                    {/* Name */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Name</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={profile.name}
                                onChangeText={(text) => handleChange('name', text)}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.name}</Text>
                        )}
                    </View>
                    {/* Gender */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Gender</Text>
                        {editMode ? (
                            <DropDownPicker
                                open={genderDropdownOpen}
                                value={profile.gender}
                                items={[
                                    { label: 'Male', value: 'male' },
                                    { label: 'Female', value: 'female' },
                                    { label: 'Other', value: 'other' },
                                ]}
                                setOpen={setGenderDropdownOpen}
                                setValue={(callback) => {
                                    const selectedGender = callback(profile.gender);
                                    handleChange('gender', selectedGender);
                                }}
                                setItems={() => { }}
                                placeholder="Select Gender"
                                style={{ borderColor: '#ccc', marginBottom: 12 }}
                                dropDownContainerStyle={{ borderColor: '#ccc' }}
                                zIndex={4000}
                                zIndexInverse={1000}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.gender || 'N/A'}</Text>
                        )}
                    </View>

                    {/* Phone */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Phone</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={profile.phone}
                                onChangeText={(text) => handleChange('phone', text)}
                                keyboardType="phone-pad"
                            />
                        ) : (
                            <Text style={styles.value}>{profile.phone}</Text>
                        )}
                    </View>

                    {/* Vehicle Model */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Vehicle Model</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={profile.vehicle_model}
                                onChangeText={(text) => handleChange('vehicle_model', text)}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.vehicle_model}</Text>
                        )}
                    </View>

                    {/* Vehicle Number */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Vehicle Number</Text>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={profile.vehicle_number}
                                onChangeText={(text) => handleChange('vehicle_number', text)}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.vehicle_number}</Text>
                        )}
                    </View>

                    {/* Vehicle Type */}
                    <View style={styles.item}>
                        <Text style={styles.label}>Vehicle Type</Text>
                        {editMode ? (
                            <DropDownPicker
                                open={vehicleDropdownOpen}
                                value={vehicleType}
                                items={vehicleTypes}
                                setOpen={setVehicleDropdownOpen}
                                setValue={(callback) => {
                                    const selectedId = callback(vehicleType);
                                    setVehicleType(selectedId);
                                    setProfile(prev => ({ ...prev, vehicle_id: parseInt(selectedId) }));
                                }}
                                setItems={setVehicleTypes}
                                placeholder={t('SelectVehicleType')}
                                style={{ borderColor: '#ccc', marginBottom: 12 }}
                                dropDownContainerStyle={{ borderColor: '#ccc' }}
                                zIndex={3000}
                                zIndexInverse={1000}
                            />
                        ) : (
                            <Text style={styles.value}>{profile.VehicleType?.type_name || 'N/A'}</Text>
                        )}
                    </View>
                    {/* Save Button */}
                    {editMode && (
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={updateProfile}
                        >
                            <Text style={styles.saveButtonText}>💾 Save</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Color.white,
    },
    header: {
        backgroundColor: Color.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 20 : 20,
        paddingBottom: 15,
        borderBottomWidth: 0.5,
        borderColor: '#ddd',
    },
    headerText: {
        color: '#000',
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderColor: Color.apptheme,
        borderWidth: 2,
        marginBottom: 20,
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    item: {
        marginBottom: 18,
    },
    label: {
        fontSize: 13,
        color: '#777',
        marginBottom: 4,
        textTransform: 'capitalize'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#f9f9f9',
    },
    value: {
        fontSize: 16,
        color: '#111',
        fontWeight: '500',
        textTransform: 'capitalize'
    },
    saveButton: {
        marginTop: 20,
        backgroundColor: Color.apptheme,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    backButton: {
        marginRight: 10,
    },
    dropdown: {
        borderColor: '#ccc',
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        marginTop: 4,
    },
    dropdownContainer: {
        borderColor: '#ccc',
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
        zIndex: 9999,
    },
});
