/*
 * Copyright Reiryoku Technologies and its contributors, www.reiryoku.com, www.mida.org
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
*/

import { MidaTradingAccount } from "#accounts/MidaTradingAccount";
import { MidaDate } from "#dates/MidaDate";
import { MidaOrder } from "#orders/MidaOrder";
import { MidaTradeDirection } from "#trades/MidaTradeDirection";
import { MidaTradeParameters } from "#trades/MidaTradeParameters";
import { MidaTradePurpose } from "#trades/MidaTradePurpose";
import { MidaTradeRejection } from "#trades/MidaTradeRejection";
import { MidaTradeStatus } from "#trades/MidaTradeStatus";

/** Represents a trade (or deal) */
export abstract class MidaTrade {
    readonly #id: string;
    readonly #orderId: string;
    readonly #positionId: string;
    readonly #tradingAccount: MidaTradingAccount;
    readonly #symbol: string;
    readonly #volume: number;
    readonly #direction: MidaTradeDirection;
    readonly #status: MidaTradeStatus;
    readonly #purpose: MidaTradePurpose;
    readonly #executionDate?: MidaDate;
    readonly #rejectionDate?: MidaDate;
    readonly #executionPrice?: number;
    readonly #grossProfit: number;
    readonly #grossProfitAsset: string;
    readonly #commission: number;
    readonly #commissionAsset: string;
    readonly #swap: number;
    readonly #swapAsset: string;
    readonly #rejection?: MidaTradeRejection;

    protected constructor ({
        id,
        orderId,
        positionId,
        tradingAccount,
        symbol,
        volume,
        direction,
        status,
        purpose,
        executionDate,
        rejectionDate,
        executionPrice,
        grossProfit,
        grossProfitAsset,
        commission,
        commissionAsset,
        swap,
        swapAsset,
        rejection,
    }: MidaTradeParameters) {
        this.#id = id;
        this.#orderId = orderId;
        this.#positionId = positionId;
        this.#tradingAccount = tradingAccount;
        this.#symbol = symbol;
        this.#volume = volume;
        this.#direction = direction;
        this.#status = status;
        this.#purpose = purpose;
        this.#executionDate = executionDate;
        this.#rejectionDate = rejectionDate;
        this.#executionPrice = executionPrice;
        this.#grossProfit = grossProfit ?? 0;
        this.#grossProfitAsset = grossProfitAsset ?? "";
        this.#commission = commission ?? 0;
        this.#commissionAsset = commissionAsset ?? "";
        this.#swap = swap ?? 0;
        this.#swapAsset = swapAsset ?? "";
        this.#rejection = rejection;
    }

    public get id (): string {
        return this.#id;
    }

    public get orderId (): string {
        return this.#orderId;
    }

    public get positionId (): string {
        return this.#positionId;
    }

    public get tradingAccount (): MidaTradingAccount {
        return this.#tradingAccount;
    }

    public get symbol (): string {
        return this.#symbol;
    }

    public get volume (): number {
        return this.#volume;
    }

    public get direction (): MidaTradeDirection {
        return this.#direction;
    }

    public get status (): MidaTradeStatus {
        return this.#status;
    }

    public get purpose (): MidaTradePurpose {
        return this.#purpose;
    }

    public get executionDate (): MidaDate | undefined {
        return this.#executionDate;
    }

    public get rejectionDate (): MidaDate | undefined {
        return this.#rejectionDate;
    }

    public get executionPrice (): number | undefined {
        return this.#executionPrice;
    }

    public get grossProfit (): number {
        return this.#grossProfit;
    }

    public get grossProfitAsset (): string {
        return this.#grossProfitAsset;
    }

    public get commission (): number {
        return this.#commission;
    }

    public get commissionAsset (): string {
        return this.#commissionAsset;
    }

    public get swap (): number {
        return this.#swap;
    }

    public get swapAsset (): string {
        return this.#swapAsset;
    }

    public get rejection (): MidaTradeRejection | undefined {
        return this.#rejection;
    }

    public get isOpening (): boolean {
        return this.#purpose === MidaTradePurpose.OPEN;
    }

    public get isClosing (): boolean {
        return this.#purpose === MidaTradePurpose.CLOSE;
    }

    public get isExecuted (): boolean {
        return this.#status === MidaTradeStatus.EXECUTED;
    }

    public get isRejected (): boolean {
        return this.#status === MidaTradeStatus.REJECTED;
    }
}

export function filterExecutedTrades (trades: MidaTrade[]): MidaTrade[] {
    const executedTrades: MidaTrade[] = [];

    for (const trade of trades) {
        if (trade.isExecuted) {
            executedTrades.push(trade);
        }
    }

    return executedTrades;
}

export function filterRejectedTrades (trades: MidaTrade[]): MidaTrade[] {
    const rejectedTrades: MidaTrade[] = [];

    for (const trade of trades) {
        if (trade.isRejected) {
            rejectedTrades.push(trade);
        }
    }

    return rejectedTrades;
}

export function getTradesFromOrders (orders: MidaOrder[]): MidaTrade[] {
    const trades: MidaTrade[] = [];

    for (const order of orders) {
        trades.push(...order.trades);
    }

    return trades;
}
