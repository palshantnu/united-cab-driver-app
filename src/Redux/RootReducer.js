const initialState = {
  user: {},
  isLoggedIn: false,
  isFirstLoggedIn: false,
  type: 'user',
  logintype: '',
  dutyActive: '',
  userdetails:{},
  vehicalType:[],
  bookings:[],
};

export const RootReducer = (state = initialState, action) => {
  switch (action.type) {


    case 'SET_USER':
      state.user = action.payload;
      state.isLoggedIn = true;
      // state.isFirstLoggedIn = true;
      return {
        ...state,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
        // isFirstLoggedIn: state.isFirstLoggedIn,
      };
    case 'SET_USERDETAILS':
      state.userdetails = action.payload;
    
      // state.isFirstLoggedIn = true;
      return {
        ...state,
        userdetails: state.userdetails,

        // isFirstLoggedIn: state.isFirstLoggedIn,
      };
    case 'SET_VEHICALTYPE':
      state.vehicalType = action.payload;
    
      // state.isFirstLoggedIn = true;
      return {
        ...state,
       vehicalType: state.vehicalType,

        // isFirstLoggedIn: state.isFirstLoggedIn,
      };
    case 'SET_BOOKINGS':
      state.bookings = action.payload;
    
      // state.isFirstLoggedIn = true;
      return {
        ...state,
        bookings: state.bookings,

        // isFirstLoggedIn: state.isFirstLoggedIn,
      };
    case 'SET_DUTYTYPE':
      state.dutyActive = action.payload;
    
      // state.isFirstLoggedIn = true;
      return {
        ...state,
       dutyActive: state.dutyActive,

        // isFirstLoggedIn: state.isFirstLoggedIn,
      };
     
    case 'LOGOUT':
      state.user = {};
      state.isLoggedIn = false;
      return {
        ...state,
      };
      case 'FIRSTLOGIN':
        state.user = {};
        state.isFirstLoggedIn = true;
        return {
          ...state,
        };
    default:
      return state;
  }
};
