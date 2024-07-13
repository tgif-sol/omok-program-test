import React, { useEffect, useState } from 'react';
import { initializeParticipant, getGameChip } from './solana';

function App() {
  const [chipCount, setChipCount] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 지갑 연결 함수
  const connectWallet = async () => {
    if (window.solana) {
      try {
        // 지갑 연결 시도
        await window.solana.connect();
        setWalletConnected(true);
        // 참가자 초기화
        await initializeParticipant();
        // 칩 카운트 가져오기
        const count = await getGameChip();
        setChipCount(count);
      } catch (err) {
        console.error("지갑 연결 실패:", err);
      }
    } else {
      console.log("Solana 객체를 찾을 수 없습니다! Phantom Wallet을 설치하세요 👻");
    }
  };

  // 칩 구매 함수
  const handleBuyChip = async () => {
    try {
      const count = await getGameChip();
      setChipCount(count);
      setShowModal(false);
    } catch (err) {
      console.error("칩 구매 중 오류 발생:", err);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {walletConnected ? (
          <div>
            <p>
              참가자 칩 개수: {chipCount !== null ? chipCount : '로딩 중...'}
            </p>
            <button onClick={() => setShowModal(true)}>칩 구매</button>
          </div>
        ) : (
          <button onClick={connectWallet}>지갑 연결</button>
        )}
      </header>
      
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>칩 구매 확인</h2>
            <p>정말로 칩을 구매하시겠습니까?</p>
            <button onClick={handleBuyChip}>확인</button>
            <button onClick={() => setShowModal(false)}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
