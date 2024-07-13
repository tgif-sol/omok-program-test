import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from './idl.json';
import { Buffer } from 'buffer';

const programId = new PublicKey("FitdZFswcrZ5jx9zPi6Sd2GyjNwiycpqdEd3W4PRKsA");

// Anchor Provider 설정 함수
const getProvider = () => {
  if (!window.solana) {
    throw new Error("Solana 객체를 찾을 수 없습니다! Phantom Wallet을 설치하세요 👻");
  }
  
  const connection = new Connection('https://api.devnet.solana.com', 'processed');
  const wallet = window.solana;
  return new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
};

// 프로그램 가져오기 함수
const getProgram = () => {
  const provider = getProvider();
  return new anchor.Program(idl, programId, provider);
};

// 참가자 초기화 함수
export const initializeParticipant = async () => {
  const program = getProgram();
  const player = program.provider.wallet.publicKey;
  const [participantPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("participant"), player.toBuffer()],
    program.programId
  );

  try {
    await program.account.participant.fetch(participantPDA);
    console.log("참가자 계정이 이미 존재합니다");
  } catch (e) {
    console.log("참가자 계정 초기화 중...");
    const txHash = await program.methods.initializeParticipant()
      .accounts({
        player: player,
        participant: participantPDA,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log(`참가자 초기화 완료, 서명: ${txHash}`);
    await program.provider.connection.confirmTransaction(txHash);
  }
};

// 게임 칩 구매 함수
export const getGameChip = async () => {
  const program = getProgram();
  const player = program.provider.wallet.publicKey;
  const gameAccount = new PublicKey("GHrTLGW8MZaUCcC6sCk2TZxkTZRM7v1AyxXWtbPJBWhu");
  const [participantPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("participant"), player.toBuffer()],
    program.programId
  );

  const txHash = await program.methods.getGameChip()
    .accounts({
      player: player,
      gameAccount: gameAccount,
      participant: participantPDA,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log(`트랜잭션 확인, 서명: ${txHash}`);
  await program.provider.connection.confirmTransaction(txHash);

  const participantAccountData = await program.account.participant.fetch(participantPDA);
  console.log("참가자 계정 데이터:", participantAccountData);

  return participantAccountData.chipCount.toString();  // 문자열로 변환
};
