import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';
import type { Account, Network } from '../types';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function base58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = value * 256n + BigInt(byte);
  }

  let result = '';
  while (value > 0n) {
    const remainder = Number(value % 58n);
    result = BASE58_ALPHABET[remainder] + result;
    value /= 58n;
  }

  for (const byte of bytes) {
    if (byte !== 0) break;
    result = `1${result}`;
  }

  return result || '1';
}

function base64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function tronAddress(seed: string): string {
  const digest = sha256(utf8ToBytes(`${seed}:TRC20`));
  const payload = digest.slice(0, 20);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const combined = new Uint8Array(payload.length + checksum.length);
  combined.set(payload, 0);
  combined.set(checksum, payload.length);
  return `T${base58(combined).slice(0, 33).padEnd(33, '1')}`;
}

function tonAddress(seed: string): string {
  const digest = sha256(utf8ToBytes(`${seed}:TON`));
  return `UQ${base64Url(digest.slice(0, 34)).slice(0, 46)}`;
}

function btcAddress(seed: string): string {
  const digest = sha256(utf8ToBytes(`${seed}:BTC`));
  let body = '';
  for (let index = 0; index < 38; index += 1) {
    body += BECH32_CHARSET[digest[index % digest.length] % 32];
  }
  return `bc1q${body}`;
}

export function deriveAddress(seedHash: string, network: Network, index: number): string {
  const seed = `${seedHash}:${index}`;
  if (network === 'TRC20') return tronAddress(seed);
  if (network === 'TON') return tonAddress(seed);
  return btcAddress(seed);
}

export function makeDemoRecipient(seedHash: string, network: Network): string {
  return deriveAddress(seedHash, network, 90210);
}

export function isValidAddress(network: Network, raw: string): boolean {
  const address = raw.trim();
  if (network === 'TRC20') {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  }
  if (network === 'TON') {
    return /^(?:EQ|UQ)[A-Za-z0-9_-]{46}$/.test(address);
  }
  return /^(?:bc1q[ac-hj-np-z02-9]{38}|bc1[a-z0-9]{25,62}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(
    address,
  );
}

export function paymentUri(account: Pick<Account, 'address' | 'network'>): string {
  if (account.network === 'TON') return `ton://transfer/${account.address}`;
  if (account.network === 'BTC') return `bitcoin:${account.address}`;
  return account.address;
}

export function txExplorerUrl(network: Network, hash: string): string {
  if (network === 'TRC20') return `https://tronscan.org/#/transaction/${hash}`;
  if (network === 'TON') return `https://tonviewer.com/transaction/${hash}`;
  return `https://mempool.space/tx/${hash}`;
}

export function fingerprintOf(value: string): string {
  return bytesToHex(sha256(utf8ToBytes(value))).slice(0, 16);
}
