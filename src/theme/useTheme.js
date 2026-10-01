import { useSelector } from 'react-redux';


const commonColors = {
    TRANSPARENT: 'transparent',

    // Header Colors
    HEADER_COLOR: '#FFFFFF',
    HEADER_ICONS_COLOR: '#000000',
    // Tabbar Colors
    ACTIVETINT_COLOR: '#540000',
    INACTIVETINT_COLOR: '#9A9A9A',
    TABBAR_BACKGROUND_COLOR: '#FFFFFF',
    TABBAR_TAB_BACKGROUND_COLOR: '#FFFFFF',

    // Buttons Color
    BUTTON_COLOR: '#540000',
    BUTTON_COLOR_GRAY: '#E1E1E1',
    BUTTON_TEXT_COLOR_WHITE: '#FFFFFF',

    // Background Color
    BACKGROUND_COLOR: '#F3F3F3',

    // Borders Color
    BORDER_COLOR: '#D8E0F0',
    BORDER_COLOR_BULE: '#4398B6',

    // Texts Color
    TEXT_COLOR_WHITE: '#FFFFFF',
    TEXT_COLOR_BLACK: '#111111',
    TEXT_COLOR_GREY: '#3A3F43',
    TEXT_COLOR_GREEN: 'green',

    // Loader Color
    LOADER_COLOR: '#540000',

    // Icon Color
    ICON_COLOR: '#111111',
    HEART_ICON_COLOR: '#540000',
    ICON_COLOR_WHITE: '#FFFFFF',

    // Price Color
    PRICE_COLOR: '#540000',

    // Notification
    UNREAD_NOTIFICATION: '#FFFECB',

    //color for 
    APP_TEXT_SECONDARY: "#141B34",
    BORDER_COLOR_2: "#D8E0F0",
    PLACEHOLDER_TEXT: "#7D8592",
    SEARCH_ICON: "#A6A6A6",
    LINK_COLOR: "#6078EC",
    HEARED_COLOR: "#121111",
    IMG_BG_COLOR: "#D9D9D9",
    BLACK_WITH_80: "#292D32",
    BLACK_THIRD: "#5D6481"
}

// eslint-disable-next-line consistent-return
const useTheme = () => {
    const theme = 1
    // console.log(theme);


    if (theme == 'theme1') {
        return {
            Colors: {
                ...commonColors,
                APPTHEME: '#FC374E',
                APPTHEMELIGHT: '#FBEDEE',
                APPTHEME_TEXT_COLOR: '#4298B5',
                HEADER_TEXT_COLOR: '#4298B5',
                TEXT_COLOR_APPTHEME: '#4298B5',
                ICON_COLOR_APPTHEME: '#FC374E',
                LIGHT_APPTHEME: '#ED7063',
                TEXT_COLOR_RED: '#ED7063',
                ICON_COLOR_RED: '#FC374E',
            },
        }
    }
    if (theme == 'theme2') {
        return {
            Colors: {
                ...commonColors,
                APPTHEME: '#55C9FF',
                APPTHEMELIGHT: '#e1f0f7',
                APPTHEME_TEXT_COLOR: '#55C9FF',
                HEADER_TEXT_COLOR: '#55C9FF',
                TEXT_COLOR_APPTHEME: '#55C9FF',
                ICON_COLOR_APPTHEME: '#55C9FF',
                LIGHT_APPTHEME: '#525252',
                TEXT_COLOR_RED: '#525252',
                ICON_COLOR_RED: '#525252',
            },
        }
    }
    if (theme == 'theme3') {
        return {
            Colors: {
                ...commonColors,
                APPTHEME: '#6078EC',
                APPTHEMELIGHT: '#d2ddfa',
                APPTHEME_TEXT_COLOR: '#6078EC',
                HEADER_TEXT_COLOR: '#6078EC',
                TEXT_COLOR_APPTHEME: '#6078EC',
                ICON_COLOR_APPTHEME: '#6078EC',
                LIGHT_APPTHEME: '#9052F5',
                TEXT_COLOR_RED: '#9052F5',
                ICON_COLOR_RED: '#9052F5',
            },
        }
    }
    if (theme == 'theme4') {
        return {
            Colors: {
                ...commonColors,
                APPTHEME: '#212121',
                APPTHEMELIGHT: '#d9d4d4',
                APPTHEME_TEXT_COLOR: '#212121',
                HEADER_TEXT_COLOR: '#212121',
                TEXT_COLOR_APPTHEME: '#212121',
                ICON_COLOR_APPTHEME: '#212121',
                LIGHT_APPTHEME: '#9052F5',
                TEXT_COLOR_RED: '#9052F5',
                ICON_COLOR_RED: '#9052F5',
            },
        }
    }
}


export default useTheme
