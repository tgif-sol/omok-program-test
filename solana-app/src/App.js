import React, { useState } from 'react';
import { initializeParticipant, getGameChip } from './solana';

function App() {
  const [chipCount, setChipCount] = useState(null);

  // 지갑 연결 및 게임 칩 구매 함수
  const connectWallet = async () => {
    try {
      // 지갑 연결 시도
      await window.solana.connect();
      console.log("지갑 연결 성공:", window.solana.publicKey.toString());

      // 참가자 초기화
      await initializeParticipant();

      // 게임 칩 구매 및 칩 수량 설정
      const count = await getGameChip();
      setChipCount(count);
    } catch (error) {
      console.error("지갑 연결 실패:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={connectWallet}>지갑 연결 및 게임 칩 구매</button>
        <p>
          참가자 칩 수량: {chipCount !== null ? chipCount : '로딩 중...'}
        </p>
      </header>
    </div>
  );
}

export default App;
