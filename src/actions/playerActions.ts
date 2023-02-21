import { PLAYER_CHOOSE_DECK } from "../constants/playerConstants";

export const chooseDeck = (deck: any) => (dispatch: any) => {
    dispatch({
        type: PLAYER_CHOOSE_DECK,
        payload: deck,
    });
}