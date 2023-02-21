import { PLAYER_CHOOSE_DECK } from "../constants/playerConstants";

export const playerReducer = (state = "", action: any) => {
    switch(action.type) {
        case PLAYER_CHOOSE_DECK:
            return state;
        default:
            return state;
    }
}