import BigNumber from "bignumber.js";
import { Tag } from "./tags";
import { Transaction } from "./transaction";

export type ParsedStruc = {
  gvc?: string;
};

export type TagMap = {
  [key: string]: typeof Tag;
};
export type Id = string | number;

export type FloorLimit = {
  amount: BigNumber;
  currency: string;
};
export type Statement = {
  transactionReference: string;
  relatedReference: string;
  accountIdentification: string;
  statementNumber: string;
  sequenceNumber: string;
  section: string;
  statementDate: Date;
  openingBalanceDate: Date;
  closingBalanceDate: Date;
  closingAvailableBalanceDate: Date;
  forwardAvailableBalanceDate: Date;
  currecy: string;
  openingBalance: number;
  closingBalance: number;
  closingAvailableBalance: number;
  forwardAvailableBalance: number;
  informationToAccountOwner: string;
  messageBlocks: any;
  transactions: Transaction[];
};

export type StatementNumber = {
  statement: string;
  sequence: string;
  section: string;
};
