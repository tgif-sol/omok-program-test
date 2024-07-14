import * as anchor from '@project-serum/anchor';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import idl from './idl.json';
import { Buffer } from 'buffer';
import {
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";

const programId = new PublicKey("7THwydBy1WnPVuqHtwKqX86t5eioqmwXcyrKzEDDAwfP");

const getProvider = () => {
  if (!window.solana) {
    throw new Error("Solana 객체를 찾을 수 없습니다! Phantom Wallet을 설치하세요 👻");
  }
  
  const connection = new Connection('https://api.devnet.solana.com', 'processed');
  const wallet = window.solana;
  return new anchor.AnchorProvider(connection, wallet, anchor.AnchorProvider.defaultOptions());
};

const getProgram = () => {
  const provider = getProvider();
  return new anchor.Program(idl, programId, provider);
};

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

export const getGameChip = async () => {
  const program = getProgram();
  const player = program.provider.wallet.publicKey;
  const gameOwner = new PublicKey("GHrTLGW8MZaUCcC6sCk2TZxkTZRM7v1AyxXWtbPJBWhu");
  const mint = new PublicKey("C3YcZRDATeGZSpkvGryJ7uoyYhD8gxrGei4pVwdcDXx8");

  // 게임 토큰 계정 가져오기 또는 생성
  let gameTokenAccount;
  try {
    const tokenAccounts = await program.provider.connection.getParsedTokenAccountsByOwner(
      gameOwner,
      { mint }
    );
    if (tokenAccounts.value.length === 0) {
      gameTokenAccount = await getOrCreateAssociatedTokenAccount(
        program.provider.connection,
        program.provider.wallet.payer,
        mint,
        gameOwner
      );
    } else {
      gameTokenAccount = tokenAccounts.value[0].pubkey;
    }
  } catch (err) {
    console.error("게임 토큰 계정을 찾거나 생성하는 중 오류 발생:", err);
    throw new Error("게임 토큰 계정을 찾거나 생성할 수 없습니다.");
  }

  // 플레이어 토큰 계정 가져오기 또는 생성
  let playerTokenAccount;
  try {
    playerTokenAccount = await getOrCreateAssociatedTokenAccount(
      program.provider.connection,
      program.provider.wallet.payer,
      mint,
      player
    );
    console.log("플레이어 토큰 계정 생성 또는 찾기 성공:", playerTokenAccount.address ? playerTokenAccount.address.toBase58() : playerTokenAccount.toBase58());

    // 토큰 잔액 확인
    const playerTokenAccountInfo = await getAccount(program.provider.connection, playerTokenAccount.address ? playerTokenAccount.address : playerTokenAccount);
    const playerTokenAmount = playerTokenAccountInfo.amount.toString();
    if (parseInt(playerTokenAmount) === 0) {
      console.error("플레이어의 토큰 잔액이 없습니다.");
      throw new Error("플레이어의 토큰 잔액이 없습니다.");
    }
  } catch (err) {
    console.error("플레이어 토큰 계정을 가져오거나 생성하는 중 오류 발생:", err);
    throw new Error("플레이어 토큰 계정을 가져오거나 생성할 수 없습니다.");
  }

  // 참가자 PDA 정의
  const [participantPDA] = await PublicKey.findProgramAddress(
    [Buffer.from("participant"), player.toBuffer()],
    program.programId
  );

  // 칩 구매 트랜잭션
  const amount = new anchor.BN(100000 * Math.pow(10, 9));  // 100,000 lamports (0.0001 SOL)
  try {
    const txHash = await program.methods.getGameChip(amount)
      .accounts({
        player: player,
        playerTokenAccount: playerTokenAccount.address ? playerTokenAccount.address : playerTokenAccount,
        gameTokenAccount: gameTokenAccount,
        participant: participantPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(`트랜잭션 확인, 서명: ${txHash}`);
    await program.provider.connection.confirmTransaction(txHash);

    const participantAccountData = await program.account.participant.fetch(participantPDA);
    console.log("참가자 계정 데이터:", participantAccountData);

    return participantAccountData.chipCount.toString();  // 문자열로 변환
  } catch (err) {
    console.error("칩 구매 트랜잭션 중 오류 발생:", err);
    throw new Error("칩 구매 트랜잭션을 완료할 수 없습니다.");
  }
};
