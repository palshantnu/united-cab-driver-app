import SimpleToast from 'react-native-simple-toast'

export const CustomToast = {
    show: (message) => {
        if (message) SimpleToast.show(message)
    },
}
