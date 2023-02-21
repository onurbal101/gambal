import React from "react";

const HomeScreen = ({ player }: any) => {
  console.log(player);
  return (
    <>
      <h1>Home</h1>
      <h2>Background</h2>
      <p>Welcome to the modern adaptation of the IOWA gambling test.</p>
      <p>It was produced by Onur Bal.</p>
      <p>
        The inspiration came from Serkan Adıgüzel's "Neuropsychological
        Evaluation Tests" course given at Yeditepe University in the autumn of
        2022, as part of the Clinical Psychology MA programme.
      </p>
      <h2>Usage</h2>
      <p>The usage of this programme is quite simple.</p>
      <p>
        Before staring the game, you may fill out the "Evaluator" "Player",
        and/or "Customisation" forms.
      </p>
      <p>All three are optional.</p>
      <p>
        "Evaluator" and "Player" forms only affect the details to appear in the
        final report.
      </p>
      <p>
        "Customisation" allows you to customise the instructions and the user
        interface of the game as you wish.
      </p>
      <p>
        At the end of the game, you can view the results in your browser, and
        download it as JSON.
      </p>
      <p>In the "History" tab, you can see all previous attempts.</p>
      <p>
        If you're using the HTML version of the programme, the history is kept
        in your web browser's local storage.
      </p>
      <p>
        If you're using the web version, the data is connected to your account
        on our web servers.
      </p>
    </>
  );
};

export default HomeScreen;
