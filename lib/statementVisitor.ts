/*
 *  Copyright 2016 Alexander Tsybulsky and other contributors
 *  Copyright 2020 Centrapay and other contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import BigNumber from 'bignumber.js';
import { Statement } from './statement';
import { Transaction } from './transaction';
import { FloorLimit, StatementNumber } from './types';
import tags, { Tag } from './tags';

export class StatementVisitor {
  tags: Tag[];
  messageBlocks: {
    [key: string]: any;
  };
  transactions: Transaction[];
  informationToAccountOwner: string[];
  message: string;
  prevTag?: Tag;
  statementDate: Date;
  accountIdentification: string;
  statementNumber: StatementNumber;
  relatedReference: string;
  transactionReference: string;
  closingBalanceDate: Date;
  closingAvailableBalanceDate: Date;
  closingAvailableBalance: BigNumber;
  forwardAvailableBalanceDate: Date;
  forwardAvailableBalance: BigNumber;
  openingBalanceDate: Date;
  openingBalance: BigNumber;
  closingBalance: BigNumber;
  currency: string;
  creditFloorLimit?: FloorLimit;
  debitFloorLimit?: FloorLimit;

  constructor() {
    this.messageBlocks = {};
    this.transactions = [];
    this.informationToAccountOwner = [];
    this.tags = [];
  }

  pushTag(tag: Tag) {
    this.tags.push(tag);
    if (!(tag instanceof tags.TagNonSwift)) {
      this.prevTag = tag;
    }
  }

  get lastTransaction() {
    return this.transactions[this.transactions.length - 1];
  }

  toStatement() {
    const statement = new Statement({
      statementDate: this.statementDate,
      accountIdentification: this.accountIdentification,
      number: this.statementNumber,
      relatedReference: this.relatedReference,
      transactionReference: this.transactionReference,
      currency: this.currency,
      transactions: this.transactions,
      closingBalanceDate: this.closingBalanceDate,
      openingBalanceDate: this.openingBalanceDate,
      openingBalance: this.openingBalance,
      closingBalance: this.closingBalance,
      closingAvailableBalanceDate: this.closingAvailableBalanceDate,
      closingAvailableBalance: this.closingAvailableBalance,
      forwardAvailableBalanceDate: this.forwardAvailableBalanceDate,
      forwardAvailableBalance: this.forwardAvailableBalance,
      informationToAccountOwner: this.informationToAccountOwner.join('\n'),
      messageBlocks: this.messageBlocks,
    });
    return statement;
  }

  visitMessageBlock(tag: Tag) {
    Object.entries(tag.fields).forEach(([key, value]) => {
      if (value && key !== 'EOB') {
        this.messageBlocks[key] = { value };
      }
    });
    this.pushTag(tag);
  }

  visitAccountIdentification(tag: Tag) {
    this.accountIdentification = tag.fields.accountIdentification;
    this.pushTag(tag);
  }

  visitStatementNumber(tag: Tag) {
    this.statementNumber = {
      statement: tag.fields.statementNumber,
      sequence: tag.fields.sequenceNumber,
      section: tag.fields.sectionNumber,
    };
    this.pushTag(tag);
  }

  visitDebitAndCreditFloorLimit(tag: Tag) {
    if (!this.currency) {
      this.currency = tag.fields.currency;
    }
    const floorLimit: FloorLimit = {
      currency: tag.fields.currency,
      amount: tag.fields.amount,
    };

    if (tag.fields.dcMark === 'C') {
      this.creditFloorLimit = floorLimit;
    } else if (tag.fields.dcMark === 'D') {
      this.debitFloorLimit = floorLimit;
    } else {
      this.creditFloorLimit = this.creditFloorLimit || floorLimit;
      this.debitFloorLimit = this.debitFloorLimit || floorLimit;
    }
    this.pushTag(tag);
  }

  visitDateTimeIndication(tag: Tag) {
    this.statementDate = tag.fields.dateTimestamp;
    this.pushTag(tag);
  }

  visitRelatedReference(tag: Tag) {
    this.relatedReference = tag.fields.relatedReference;
    this.pushTag(tag);
  }

  visitTransactionReferenceNumber(tag: Tag) {
    this.transactionReference = tag.fields.transactionReference;
    this.pushTag(tag);
  }

  visitStatementLine(tag: Tag) {
    this.transactions.push(
      new Transaction({
        ...(tag.fields as any),
        currency: this.currency,
        detailSegments: [],
      })
    );
    this.pushTag(tag);
  }

  visitTransactionDetails(tag: Tag) {
    if (this.prevTag instanceof tags.TagStatementLine) {
      this.lastTransaction.detailSegments.push(tag.fields.transactionDetails);
    } else {
      this.informationToAccountOwner.push(tag.fields.transactionDetails);
    }
    this.pushTag(tag);
  }

  visitOpeningBalance(tag: Tag) {
    this.openingBalanceDate = tag.fields.date;
    this.openingBalance = tag.fields.amount;
    this.currency = tag.fields.currency;
    this.pushTag(tag);
  }

  visitClosingBalance(tag: Tag) {
    this.statementDate = tag.fields.date;
    this.closingBalanceDate = tag.fields.date;
    this.closingBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitNumberAndSumOfEntries(tag: Tag) {
    this.pushTag(tag);
  }

  visitForwardAvailableBalance(tag: Tag) {
    this.forwardAvailableBalanceDate = tag.fields.date;
    this.forwardAvailableBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitClosingAvailableBalance(tag: Tag) {
    this.closingAvailableBalanceDate = tag.fields.date;
    this.closingAvailableBalance = tag.fields.amount;
    this.pushTag(tag);
  }

  visitNonSwift(tag: Tag) {
    if (
      this.prevTag instanceof tags.TagStatementLine ||
      this.prevTag instanceof tags.TagTransactionDetails
    ) {
      this.lastTransaction.nonSwift = tag.data;
    }
    this.pushTag(tag);
  }
}
