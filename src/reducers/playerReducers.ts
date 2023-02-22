import { PLAYER_CHOOSE_DECK_A } from "../constants/playerConstants";

export const playerReducer = (state = "", action: any) => {
    switch(action.type) {
        case PLAYER_CHOOSE_DECK_A:
            return state;
        default:
            return state;
    }
}