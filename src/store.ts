import { legacy_createStore as createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";

import { playerReducer } from "./reducers/playerReducers";

const reducer = combineReducers([playerReducer]);

const initialState: any = {};

const middleware = [thunk]

const enhancer = composeWithDevTools(applyMiddleware(...middleware));

const store = createStore(
    reducer, 
    initialState, 
    enhancer
    );

export default store;