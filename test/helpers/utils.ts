import { ethers } from 'ethers';

export function toWeiStr(value: number | string): string {
  return ethers.utils.parseUnits(`${value}`).toString();
}
