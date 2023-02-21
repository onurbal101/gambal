const EVALUATOR_SET_NAME = "EVALUATOR_SET_NAME";

export const setName = (name: string) => (dispatch: any) => {
    dispatch({
        type: EVALUATOR_SET_NAME,
        payload: name
    });
};

export const setTitle = (title: string) => (dispatch: any) => {
    dispatch({
        type: EVALUATOR_SET_NAME,
        payload: title
    });
};

export const setProfession = (title: string) => (dispatch: any) => {
    dispatch({
        type: EVALUATOR_SET_NAME,
        payload: title
    });
};