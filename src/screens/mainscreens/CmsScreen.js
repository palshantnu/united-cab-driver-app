import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import RenderHTML from 'react-native-render-html';

const CmsScreen = ({ route }) => {
    const { type } = route.params;
    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState('');
    const [title, setTitle] = useState('');

    const fetchCMS = async () => {
        try {
            const res = await fetch('https://unitedcabsmerthyr.uk/api/cmslist');
            const json = await res.json();

            const page = json.data.find(item => item.page_type === type);

            if (page) {
                setTitle(page.title);
                const formattedContent = page.content
                    .replace(/\\r\\n/g, '<br/>')
                    .replace(/•/g, '<br/>•');
                setContent(formattedContent);
            } else {
                setContent('<p>Content not found</p>');
                setTitle('Page Not Found');
            }
        } catch (error) {
            console.log('CMS Error:', error);
            setContent('<p>Error loading content. Please try again later.</p>');
            setTitle('Error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCMS();
    }, []);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={title} />
            </Appbar.Header>
            
            <ScrollView style={styles.content}>
                <RenderHTML
                    contentWidth={width}
                    source={{ html: content }}
                    tagsStyles={{
                        body: {
                            fontSize: 16,
                            lineHeight: 24,
                            color: '#333',
                        },
                        p: {
                            marginBottom: 12,
                        },
                        h1: {
                            fontSize: 28,
                            fontWeight: 'bold',
                            marginBottom: 16,
                        },
                        h2: {
                            fontSize: 24,
                            fontWeight: 'bold',
                            marginBottom: 12,
                        },
                    }}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
    },
});

export default CmsScreen;