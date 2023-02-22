import { 
    PLAYER_CHOOSE_DECK_A, 
    PLAYER_CHOOSE_DECK_B, 
    PLAYER_CHOOSE_DECK_C, 
    PLAYER_CHOOSE_DECK_D 
} from "../constants/playerConstants";

export const chooseDeckA = () => (dispatch: any) => {
    dispatch({
        type: PLAYER_CHOOSE_DECK_A,
    });
};

export const chooseDeckB = () => (dispatch: any) => {
    dispatch({
        type: PLAYER_CHOOSE_DECK_B,
    });
};

export const chooseDeckC = () => (dispatch: any) => {
    dispatch({
        type: PLAYER_CHOOSE_DECK_C,
    });
};

export const chooseDeckD = () => (dispatch: any) => {
    dispatch({
        type: PLAYER_CHOOSE_DECK_D,
    });
};