import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import {
  bytesToHex,
  hexToBytes,
  randomBytes,
  utf8ToBytes,
} from '@noble/hashes/utils';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export function generateSeed(): string {
  return generateMnemonic(wordlist, 128);
}

export function seedFingerprint(seed: string): string {
  return bytesToHex(sha256(utf8ToBytes(seed.trim().toLowerCase())));
}

export function makePinSalt(): string {
  return bytesToHex(randomBytes(16));
}

export function hashPin(pin: string, salt: string): string {
  const derived = pbkdf2(sha256, utf8ToBytes(pin), hexToBytes(salt), {
    c: 100_000,
    dkLen: 32,
  });
  return bytesToHex(derived);
}

export function sha256Hex(input: string): string {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

export function makeId(prefix = ''): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}${cryptoApi.randomUUID()}`;
  }
  return `${prefix}${bytesToHex(randomBytes(16))}`;
}

export function makeLogin(seedHash: string): string {
  return `RW-${seedHash.slice(0, 4).toUpperCase()}-${seedHash
    .slice(4, 8)
    .toUpperCase()}`;
}

export function makeTxHash(seed = makeId()): string {
  return sha256Hex(`tx:${seed}:${Date.now()}`);
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
