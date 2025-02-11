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
import { MidaEvent } from "#events/MidaEvent";
import { MidaEventListener } from "#events/MidaEventListener";
import { MidaOrderDirection } from "#orders/MidaOrderDirection";
import { MidaOrderExecution } from "#orders/MidaOrderExecution";
import { MidaOrderFill } from "#orders/MidaOrderFill";
import { MidaOrderParameters } from "#orders/MidaOrderParameters";
import { MidaOrderPurpose } from "#orders/MidaOrderPurpose";
import { MidaOrderRejection } from "#orders/MidaOrderRejection";
import { MidaOrderStatus } from "#orders/MidaOrderStatus";
import { MidaOrderTimeInForce } from "#orders/MidaOrderTimeInForce";
import { filterExecutedTrades, MidaTrade } from "#trades/MidaTrade";
import { MidaEmitter } from "#utilities/emitters/MidaEmitter";

/** Represents an order */
export abstract class MidaOrder {
    #id: string;
    readonly #tradingAccount: MidaTradingAccount;
    readonly #symbol: string;
    #requestedVolume: number;
    readonly #direction: MidaOrderDirection;
    readonly #purpose: MidaOrderPurpose;
    #limitPrice?: number;
    #stopPrice?: number;
    #status: MidaOrderStatus;
    #creationDate?: MidaDate;
    #lastUpdateDate?: MidaDate;
    readonly #timeInForce: MidaOrderTimeInForce;
    readonly #trades: MidaTrade[];
    #positionId: string;
    #rejection?: MidaOrderRejection;
    readonly #isStopOut: boolean;
    readonly #emitter: MidaEmitter;

    protected constructor ({
        id,
        tradingAccount,
        symbol,
        requestedVolume,
        direction,
        purpose,
        limitPrice,
        stopPrice,
        status,
        creationDate,
        lastUpdateDate,
        timeInForce,
        trades,
        positionId,
        rejection,
        isStopOut,
    }: MidaOrderParameters) {
        this.#id = id;
        this.#tradingAccount = tradingAccount;
        this.#symbol = symbol;
        this.#requestedVolume = requestedVolume;
        this.#direction = direction;
        this.#purpose = purpose;
        this.#limitPrice = limitPrice;
        this.#stopPrice = stopPrice;
        this.#status = status;
        this.#creationDate = creationDate;
        this.#lastUpdateDate = lastUpdateDate;
        this.#timeInForce = timeInForce;
        this.#trades = trades;
        this.#positionId = positionId ?? "";
        this.#rejection = rejection;
        this.#isStopOut = isStopOut ?? false;
        this.#emitter = new MidaEmitter();
    }

    public get id (): string {
        return this.#id;
    }

    protected set id (id: string) {
        this.#id = id;
    }

    public get tradingAccount (): MidaTradingAccount {
        return this.#tradingAccount;
    }

    public get symbol (): string {
        return this.#symbol;
    }

    public get requestedVolume (): number {
        return this.#requestedVolume;
    }

    public get direction (): MidaOrderDirection {
        return this.#direction;
    }

    public get purpose (): MidaOrderPurpose {
        return this.#purpose;
    }

    public get limitPrice (): number | undefined {
        return this.#limitPrice;
    }

    public get stopPrice (): number | undefined {
        return this.#stopPrice;
    }

    public get status (): MidaOrderStatus {
        return this.#status;
    }

    public get creationDate (): MidaDate | undefined {
        return this.#creationDate;
    }

    protected set creationDate (creationDate: MidaDate | undefined) {
        this.#creationDate = creationDate;
    }

    public get lastUpdateDate (): MidaDate | undefined {
        return this.#lastUpdateDate;
    }

    protected set lastUpdateDate (lastUpdateDate: MidaDate | undefined) {
        this.#lastUpdateDate = lastUpdateDate;
    }

    public get timeInForce (): MidaOrderTimeInForce {
        return this.#timeInForce;
    }

    public get trades (): MidaTrade[] {
        return this.#trades;
    }

    public get positionId (): string {
        return this.#positionId;
    }

    protected set positionId (positionId: string) {
        this.#positionId = positionId;
    }

    public get rejection (): MidaOrderRejection | undefined {
        return this.#rejection;
    }

    protected set rejection (rejection: MidaOrderRejection | undefined) {
        this.#rejection = rejection;
    }

    public get isStopOut (): boolean {
        return this.#isStopOut;
    }

    public get isExecuted (): boolean {
        return this.#status === MidaOrderStatus.EXECUTED;
    }

    public get executedTrades (): MidaTrade[] {
        return filterExecutedTrades(this.#trades);
    }

    public get filledVolume (): number {
        let filledVolume: number = 0;

        for (const trade of this.executedTrades) {
            filledVolume += trade.volume;
        }

        return filledVolume;
    }

    public get fill (): MidaOrderFill | undefined {
        if (this.executedTrades.length === 0) {
            return undefined;
        }

        if (this.filledVolume === this.#requestedVolume) {
            return MidaOrderFill.FULL;
        }

        return MidaOrderFill.PARTIAL;
    }

    public get executionPrice (): number | undefined {
        if (this.executedTrades.length === 0) {
            return undefined;
        }

        let priceVolumeProduct: number = 0;

        for (const trade of this.executedTrades) {
            const executionPrice: number = trade.executionPrice as number;

            priceVolumeProduct += executionPrice * trade.volume;
        }

        return priceVolumeProduct / this.filledVolume;
    }

    public get isOpening (): boolean {
        return this.#purpose === MidaOrderPurpose.OPEN;
    }

    public get isClosing (): boolean {
        return this.#purpose === MidaOrderPurpose.CLOSE;
    }

    public get execution (): MidaOrderExecution {
        if (Number.isFinite(this.#limitPrice)) {
            return MidaOrderExecution.LIMIT;
        }

        if (Number.isFinite(this.#stopPrice)) {
            return MidaOrderExecution.STOP;
        }

        return MidaOrderExecution.MARKET;
    }

    public get isRejected (): boolean {
        return this.#status === MidaOrderStatus.REJECTED;
    }

    public abstract cancel (): Promise<void>;

    public on (type: string): Promise<MidaEvent>;
    public on (type: string, listener: MidaEventListener): string;
    public on (type: string, listener?: MidaEventListener): Promise<MidaEvent> | string {
        if (!listener) {
            return this.#emitter.on(type);
        }

        return this.#emitter.on(type, listener);
    }

    public removeEventListener (uuid: string): void {
        this.#emitter.removeEventListener(uuid);
    }

    /* *** *** *** Reiryoku Technologies *** *** *** */

    protected onStatusChange (status: MidaOrderStatus): void {
        if (this.#status === status) {
            return;
        }

        const previousStatus: MidaOrderStatus = this.#status;
        this.#status = status;

        switch (status) {
            case MidaOrderStatus.REJECTED: {
                this.#emitter.notifyListeners("reject");

                break;
            }
            case MidaOrderStatus.ACCEPTED: {
                this.#emitter.notifyListeners("accept");

                break;
            }
            case MidaOrderStatus.PENDING: {
                this.#emitter.notifyListeners("pending");

                break;
            }
            case MidaOrderStatus.CANCELLED: {
                this.#emitter.notifyListeners("cancel");

                break;
            }
            case MidaOrderStatus.EXECUTED: {
                this.#emitter.notifyListeners("execute");

                break;
            }
            case MidaOrderStatus.EXPIRED: {
                this.#emitter.notifyListeners("expire");

                break;
            }
        }

        this.#emitter.notifyListeners("status-change", { status, previousStatus, });
    }

    protected onPendingPriceChange (price: number): void {
        if (Number.isFinite(this.#limitPrice)) {
            this.#limitPrice = price;
        }
        else if (Number.isFinite(this.#stopPrice)) {
            this.#stopPrice = price;
        }

        this.#emitter.notifyListeners("pending-price-change", { price, });
    }

    protected onPendingVolumeChange (volume: number): void {
        if (this.#requestedVolume === volume) {
            return;
        }

        this.#requestedVolume = volume;

        this.#emitter.notifyListeners("pending-volume-change", { volume, });
    }

    protected onTrade (trade: MidaTrade): void {
        this.#trades.push(trade);
        this.#emitter.notifyListeners("trade", { trade, });
    }
}

export function filterPendingOrders (orders: MidaOrder[]): MidaOrder[] {
    const pendingOrders: MidaOrder[] = [];

    for (const order of orders) {
        if (order.status === MidaOrderStatus.PENDING) {
            pendingOrders.push(order);
        }
    }

    return pendingOrders;
}

export function filterExecutedOrders (orders: MidaOrder[]): MidaOrder[] {
    const executedOrders: MidaOrder[] = [];

    for (const order of orders) {
        if (order.isExecuted) {
            executedOrders.push(order);
        }
    }

    return executedOrders;
}
