import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Main from "./components/Main/Main";
import Room from "./components/Room/Room";
import styled from "styled-components";

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  font-size: calc(8px + 2vmin);
  color: white;
  background-color: #454552;
  text-align: center;
`;

function App() {
  return (
    <BrowserRouter>
      <AppContainer>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </AppContainer>
    </BrowserRouter>
  );
}

export default App;
