import BigNumber from 'bignumber.js';
import { Transaction, FetchAllOptions } from './transaction/TransactionController';
import { MessageParams } from './message-manager/MessageManager';
import { PersonalMessageParams } from './message-manager/PersonalMessageManager';
import { TypedMessageParams } from './message-manager/TypedMessageManager';
import { Token } from './assets/TokenRatesController';
/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param inputBn - BN instance to convert to a hex string
 * @returns - '0x'-prefixed hex string
 *
 */
export declare function BNToHex(inputBn: any): string;
/**
 * Used to multiply a BN by a fraction
 *
 * @param targetBN - Number to multiply by a fraction
 * @param numerator - Numerator of the fraction multiplier
 * @param denominator - Denominator of the fraction multiplier
 * @returns - Product of the multiplication
 */
export declare function fractionBN(targetBN: any, numerator: number | string, denominator: number | string): any;
/**
 * Return a URL that can be used to obtain ETH for a given network
 *
 * @param networkCode - Network code of desired network
 * @param address - Address to deposit obtained ETH
 * @param amount - How much ETH is desired
 * @returns - URL to buy ETH based on network
 */
export declare function getBuyURL(networkCode?: string, address?: string, amount?: number): string | undefined;
/**
 * Return a URL that can be used to fetch ETH transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param fromBlock? - Block from which transactions are needed
 * @returns - URL to fetch the transactions from
 */
export declare function getEtherscanApiUrl(networkType: string, address: string, fromBlock?: string): string;
/**
 * Return a URL that can be used to fetch ERC20 token transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param opt? - Object that can contain fromBlock and Alethio service API key
 * @returns - URL to fetch the transactions from
 */
export declare function getAlethioApiUrl(networkType: string, address: string, opt?: FetchAllOptions): {
    url: string;
    headers: {};
} | {
    url: string;
    headers: {
        Authorization: string;
    } | undefined;
};
/**
 * Handles the fetch of incoming transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param opt? - Object that can contain fromBlock and Alethio service API key
 * @returns - Responses for both ETH and ERC20 token transactions
 */
export declare function handleTransactionFetch(networkType: string, address: string, opt?: FetchAllOptions): Promise<[{
    [result: string]: [];
}, {
    [data: string]: [];
}]>;
/**
 * Converts a hex string to a BN object
 *
 * @param inputHex - Number represented as a hex string
 * @returns - A BN instance
 *
 */
export declare function hexToBN(inputHex: string): any;
/**
 * A helper function that converts hex data to human readable string
 *
 * @param hex - The hex string to convert to string
 * @returns - A human readable string conversion
 *
 */
export declare function hexToText(hex: string): string;
/**
 * Given the standard set of information about a transaction, returns a transaction properly formatted for
 * publishing via JSON RPC and web3
 *
 * @param {boolean} [sendToken] - Indicates whether or not the transaciton is a token transaction
 * @param {string} data - A hex string containing the data to include in the transaction
 * @param {string} to - A hex address of the tx recipient address
 * @param {string} amount - A hex amount, in case of a token tranaction will be set to Tx value
 * @param {string} from - A hex address of the tx sender address
 * @param {string} gas - A hex representation of the gas value for the transaction
 * @param {string} gasPrice - A hex representation of the gas price for the transaction
 * @returns {object} An object ready for submission to the blockchain, with all values appropriately hex prefixed
 */
export declare function constructTxParams({ sendToken, data, to, amount, from, gas, gasPrice, }: {
    sendToken?: boolean;
    data?: string;
    to?: string;
    from: string;
    gas?: string;
    gasPrice?: string;
    amount?: string;
}): any;
/**
 * Normalizes properties on a Transaction object
 *
 * @param transaction - Transaction object to normalize
 * @returns - Normalized Transaction object
 */
export declare function normalizeTransaction(transaction: Transaction): Transaction;
/**
 * Execute and return an asynchronous operation without throwing errors
 *
 * @param operation - Function returning a Promise
 * @param logError - Determines if the error should be logged
 * @param retry - Function called if an error is caught
 * @returns - Promise resolving to the result of the async operation
 */
export declare function safelyExecute(operation: () => Promise<any>, logError?: boolean, retry?: (error: Error) => void): Promise<any>;
/**
 * Validates a Transaction object for required properties and throws in
 * the event of any validation error.
 *
 * @param transaction - Transaction object to validate
 */
export declare function validateTransaction(transaction: Transaction): void;
/**
 * A helper function that converts rawmessageData buffer data to a hex, or just returns the data if
 * it is already formatted as a hex.
 *
 * @param data - The buffer data to convert to a hex
 * @returns - A hex string conversion of the buffer data
 *
 */
export declare function normalizeMessageData(data: string): string;
/**
 * Validates a PersonalMessageParams and MessageParams objects for required properties and throws in
 * the event of any validation error.
 *
 * @param messageData - PersonalMessageParams object to validate
 */
export declare function validateSignMessageData(messageData: PersonalMessageParams | MessageParams): void;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V1.
 *
 * @param messageData - TypedMessageParams object to validate
 * @param activeChainId - Active chain id
 */
export declare function validateTypedSignMessageDataV1(messageData: TypedMessageParams): void;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V3.
 *
 * @param messageData - TypedMessageParams object to validate
 */
export declare function validateTypedSignMessageDataV3(messageData: TypedMessageParams): void;
/**
 * Validates a ERC20 token to be added with EIP747.
 *
 * @param token - Token object to validate
 */
export declare function validateTokenToWatch(token: Token): void;
/**
 * Returns wether the given code corresponds to a smart contract
 *
 * @returns {string} - Corresponding code to review
 */
export declare function isSmartContractCode(code: string): boolean;
/**
 * Execute fetch and verify that the response was successful
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the fetch response
 */
export declare function successfulFetch(request: string, options?: RequestInit): Promise<Response>;
/**
 * Execute fetch and return object response
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the result object of fetch
 */
export declare function handleFetch(request: string, options?: RequestInit): Promise<any>;
/**
 * Fetch that fails after timeout
 *
 * @param url - Url to fetch
 * @param options - Options to send with the request
 * @param timeout - Timeout to fail request
 *
 * @returns - Promise resolving the request
 */
export declare function timeoutFetch(url: string, options?: RequestInit, timeout?: number): Promise<any>;
/**
 * Normalizes the given ENS name.
 *
 * @param {string} ensName - The ENS name
 *
 * @returns - the normalized ENS name string
 */
export declare function normalizeEnsName(ensName: string): string | null;
export declare function calcTokenAmount(value: number | BigNumber, decimals: number): BigNumber;
/**
 * Query format using current provided eth query object
 * @param method - Method to query
 * @param ethQuery - EthQuery object
 * @param args - Conveninent arguments to execute the query
 * @returns - Promise resolving to the respective result
 */
export declare function query(method: string, ethQuery: any, args?: any[]): Promise<any>;
/**
 * Estimates required gas for a given transaction
 *
 * @param transaction - Transaction object to estimate gas for
 * @returns - Promise resolving to an object containing gas and gasPrice
 */
export declare function estimateGas(transaction: Transaction, ethQuery: any): Promise<{
    blockGasLimit: any;
    gas: string;
}>;
declare const _default: {
    BNToHex: typeof BNToHex;
    fractionBN: typeof fractionBN;
    getBuyURL: typeof getBuyURL;
    handleFetch: typeof handleFetch;
    hexToBN: typeof hexToBN;
    hexToText: typeof hexToText;
    isSmartContractCode: typeof isSmartContractCode;
    constructTxParams: typeof constructTxParams;
    normalizeTransaction: typeof normalizeTransaction;
    safelyExecute: typeof safelyExecute;
    successfulFetch: typeof successfulFetch;
    timeoutFetch: typeof timeoutFetch;
    validateTokenToWatch: typeof validateTokenToWatch;
    validateTransaction: typeof validateTransaction;
    validateTypedSignMessageDataV1: typeof validateTypedSignMessageDataV1;
    validateTypedSignMessageDataV3: typeof validateTypedSignMessageDataV3;
    calcTokenAmount: typeof calcTokenAmount;
    estimateGas: typeof estimateGas;
    query: typeof query;
};
export default _default;
