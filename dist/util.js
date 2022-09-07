"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateGas = exports.query = exports.calcTokenAmount = exports.normalizeEnsName = exports.timeoutFetch = exports.handleFetch = exports.successfulFetch = exports.isSmartContractCode = exports.validateTokenToWatch = exports.validateTypedSignMessageDataV3 = exports.validateTypedSignMessageDataV1 = exports.validateSignMessageData = exports.normalizeMessageData = exports.validateTransaction = exports.safelyExecute = exports.normalizeTransaction = exports.constructTxParams = exports.hexToText = exports.hexToBN = exports.handleTransactionFetch = exports.getAlethioApiUrl = exports.getEtherscanApiUrl = exports.getBuyURL = exports.fractionBN = exports.BNToHex = void 0;
const ethereumjs_util_1 = require("ethereumjs-util");
const bignumber_js_1 = require("bignumber.js");
const eth_rpc_errors_1 = require("eth-rpc-errors");
const eth_sig_util_1 = require("eth-sig-util");
const jsonschema = require('jsonschema');
const { BN, stripHexPrefix } = require('ethereumjs-util');
const ensNamehash = require('eth-ens-namehash');
const hexRe = /^[0-9A-Fa-f]+$/gu;
const NORMALIZERS = {
    data: (data) => ethereumjs_util_1.addHexPrefix(data),
    from: (from) => ethereumjs_util_1.addHexPrefix(from).toLowerCase(),
    gas: (gas) => ethereumjs_util_1.addHexPrefix(gas),
    gasPrice: (gasPrice) => ethereumjs_util_1.addHexPrefix(gasPrice),
    nonce: (nonce) => ethereumjs_util_1.addHexPrefix(nonce),
    to: (to) => ethereumjs_util_1.addHexPrefix(to).toLowerCase(),
    value: (value) => ethereumjs_util_1.addHexPrefix(value),
};
/**
 * Converts a BN object to a hex string with a '0x' prefix
 *
 * @param inputBn - BN instance to convert to a hex string
 * @returns - '0x'-prefixed hex string
 *
 */
function BNToHex(inputBn) {
    return ethereumjs_util_1.addHexPrefix(inputBn.toString(16));
}
exports.BNToHex = BNToHex;
/**
 * Used to multiply a BN by a fraction
 *
 * @param targetBN - Number to multiply by a fraction
 * @param numerator - Numerator of the fraction multiplier
 * @param denominator - Denominator of the fraction multiplier
 * @returns - Product of the multiplication
 */
function fractionBN(targetBN, numerator, denominator) {
    const numBN = new BN(numerator);
    const denomBN = new BN(denominator);
    return targetBN.mul(numBN).div(denomBN);
}
exports.fractionBN = fractionBN;
/**
 * Return a URL that can be used to obtain ETH for a given network
 *
 * @param networkCode - Network code of desired network
 * @param address - Address to deposit obtained ETH
 * @param amount - How much ETH is desired
 * @returns - URL to buy ETH based on network
 */
function getBuyURL(networkCode = '1', address, amount = 5) {
    switch (networkCode) {
        case '1':
            return `https://buy.coinbase.com/?code=9ec56d01-7e81-5017-930c-513daa27bb6a&amount=${amount}&address=${address}&crypto_currency=ETH`;
        case '3':
            return 'https://faucet.metamask.io/';
        case '4':
            return 'https://www.rinkeby.io/';
        case '5':
            return 'https://goerli-faucet.slock.it/';
        case '42':
            return 'https://github.com/kovan-testnet/faucet';
    }
}
exports.getBuyURL = getBuyURL;
/**
 * Return a URL that can be used to fetch ETH transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param fromBlock? - Block from which transactions are needed
 * @returns - URL to fetch the transactions from
 */
function getEtherscanApiUrl(networkType, address, fromBlock) {
    let etherscanSubdomain = 'api';
    /* istanbul ignore next */
    if (networkType !== 'mainnet') {
        etherscanSubdomain = `api-${networkType}`;
    }
    const apiUrl = `https://${etherscanSubdomain}.etherscan.io`;
    let url = `${apiUrl}/api?module=account&action=txlist&address=${address}&tag=latest&page=1`;
    if (fromBlock) {
        url += `&startBlock=${fromBlock}`;
    }
    return url;
}
exports.getEtherscanApiUrl = getEtherscanApiUrl;
/**
 * Return a URL that can be used to fetch ERC20 token transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param opt? - Object that can contain fromBlock and Alethio service API key
 * @returns - URL to fetch the transactions from
 */
function getAlethioApiUrl(networkType, address, opt) {
    if (networkType !== 'mainnet') {
        return { url: '', headers: {} };
    }
    let url = `https://api.aleth.io/v1/token-transfers?filter[to]=${address}`;
    // From alethio implementation
    // cursor = hardcoded prefix `0x00` + fromBlock in hex format + max possible tx index `ffff`
    let fromBlock = opt && opt.fromBlock;
    if (fromBlock) {
        fromBlock = parseInt(fromBlock).toString(16);
        let prev = `0x00${fromBlock}ffff`;
        while (prev.length < 34) {
            prev += '0';
        }
        url += `&page[prev]=${prev}`;
    }
    /* istanbul ignore next */
    const headers = opt && opt.alethioApiKey ? { Authorization: `Bearer ${opt.alethioApiKey}` } : undefined;
    return { url, headers };
}
exports.getAlethioApiUrl = getAlethioApiUrl;
/**
 * Handles the fetch of incoming transactions
 *
 * @param networkType - Network type of desired network
 * @param address - Address to get the transactions from
 * @param opt? - Object that can contain fromBlock and Alethio service API key
 * @returns - Responses for both ETH and ERC20 token transactions
 */
function handleTransactionFetch(networkType, address, opt) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = getEtherscanApiUrl(networkType, address, opt && opt.fromBlock);
        const etherscanResponsePromise = handleFetch(url);
        const alethioUrl = getAlethioApiUrl(networkType, address, opt);
        const alethioResponsePromise = alethioUrl.url !== '' && handleFetch(alethioUrl.url, { headers: alethioUrl.headers });
        let [etherscanResponse, alethioResponse] = yield Promise.all([etherscanResponsePromise, alethioResponsePromise]);
        if (etherscanResponse.status === '0' || etherscanResponse.result.length <= 0) {
            etherscanResponse = { result: [] };
        }
        if (!alethioUrl.url || !alethioResponse || !alethioResponse.data) {
            alethioResponse = { data: [] };
        }
        return [etherscanResponse, alethioResponse];
    });
}
exports.handleTransactionFetch = handleTransactionFetch;
/**
 * Converts a hex string to a BN object
 *
 * @param inputHex - Number represented as a hex string
 * @returns - A BN instance
 *
 */
function hexToBN(inputHex) {
    return new BN(stripHexPrefix(inputHex), 16);
}
exports.hexToBN = hexToBN;
/**
 * A helper function that converts hex data to human readable string
 *
 * @param hex - The hex string to convert to string
 * @returns - A human readable string conversion
 *
 */
function hexToText(hex) {
    try {
        const stripped = stripHexPrefix(hex);
        const buff = Buffer.from(stripped, 'hex');
        return buff.toString('utf8');
    }
    catch (e) {
        /* istanbul ignore next */
        return hex;
    }
}
exports.hexToText = hexToText;
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
function constructTxParams({ sendToken, data, to, amount, from, gas, gasPrice, }) {
    const txParams = {
        data,
        from,
        value: '0',
        gas,
        gasPrice,
    };
    if (!sendToken) {
        txParams.value = amount;
        txParams.to = to;
    }
    return normalizeTransaction(txParams);
}
exports.constructTxParams = constructTxParams;
/**
 * Normalizes properties on a Transaction object
 *
 * @param transaction - Transaction object to normalize
 * @returns - Normalized Transaction object
 */
function normalizeTransaction(transaction) {
    const normalizedTransaction = { from: '' };
    let key;
    for (key in NORMALIZERS) {
        if (transaction[key]) {
            normalizedTransaction[key] = NORMALIZERS[key](transaction[key]);
        }
    }
    return normalizedTransaction;
}
exports.normalizeTransaction = normalizeTransaction;
/**
 * Execute and return an asynchronous operation without throwing errors
 *
 * @param operation - Function returning a Promise
 * @param logError - Determines if the error should be logged
 * @param retry - Function called if an error is caught
 * @returns - Promise resolving to the result of the async operation
 */
function safelyExecute(operation, logError = false, retry) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield operation();
        }
        catch (error) {
            /* istanbul ignore next */
            if (logError) {
                console.error(error);
            }
            retry && retry(error);
        }
    });
}
exports.safelyExecute = safelyExecute;
/**
 * Validates a Transaction object for required properties and throws in
 * the event of any validation error.
 *
 * @param transaction - Transaction object to validate
 */
function validateTransaction(transaction) {
    if (!transaction.from || typeof transaction.from !== 'string' || !ethereumjs_util_1.isValidAddress(transaction.from)) {
        throw new Error(`Invalid "from" address: ${transaction.from} must be a valid string.`);
    }
    if (transaction.to === '0x' || transaction.to === undefined) {
        if (transaction.data) {
            delete transaction.to;
        }
        else {
            throw new Error(`Invalid "to" address: ${transaction.to} must be a valid string.`);
        }
    }
    else if (transaction.to !== undefined && !ethereumjs_util_1.isValidAddress(transaction.to)) {
        throw new Error(`Invalid "to" address: ${transaction.to} must be a valid string.`);
    }
    if (transaction.value !== undefined) {
        const value = transaction.value.toString();
        if (value.includes('-')) {
            throw new Error(`Invalid "value": ${value} is not a positive number.`);
        }
        if (value.includes('.')) {
            throw new Error(`Invalid "value": ${value} number must be denominated in wei.`);
        }
        const intValue = parseInt(transaction.value, 10);
        const isValid = Number.isFinite(intValue) && !Number.isNaN(intValue) && !isNaN(Number(value)) && Number.isSafeInteger(intValue);
        if (!isValid) {
            throw new Error(`Invalid "value": ${value} number must be a valid number.`);
        }
    }
}
exports.validateTransaction = validateTransaction;
/**
 * A helper function that converts rawmessageData buffer data to a hex, or just returns the data if
 * it is already formatted as a hex.
 *
 * @param data - The buffer data to convert to a hex
 * @returns - A hex string conversion of the buffer data
 *
 */
function normalizeMessageData(data) {
    try {
        const stripped = stripHexPrefix(data);
        if (stripped.match(hexRe)) {
            return ethereumjs_util_1.addHexPrefix(stripped);
        }
    }
    catch (e) {
        /* istanbul ignore next */
    }
    return ethereumjs_util_1.bufferToHex(Buffer.from(data, 'utf8'));
}
exports.normalizeMessageData = normalizeMessageData;
/**
 * Validates a PersonalMessageParams and MessageParams objects for required properties and throws in
 * the event of any validation error.
 *
 * @param messageData - PersonalMessageParams object to validate
 */
function validateSignMessageData(messageData) {
    if (!messageData.from || typeof messageData.from !== 'string' || !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || typeof messageData.data !== 'string') {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid string.`);
    }
}
exports.validateSignMessageData = validateSignMessageData;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V1.
 *
 * @param messageData - TypedMessageParams object to validate
 * @param activeChainId - Active chain id
 */
function validateTypedSignMessageDataV1(messageData) {
    if (!messageData.from || typeof messageData.from !== 'string' || !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || !Array.isArray(messageData.data)) {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid array.`);
    }
    try {
        // typedSignatureHash will throw if the data is invalid.
        eth_sig_util_1.typedSignatureHash(messageData.data);
    }
    catch (e) {
        throw new Error(`Expected EIP712 typed data.`);
    }
}
exports.validateTypedSignMessageDataV1 = validateTypedSignMessageDataV1;
/**
 * Validates a TypedMessageParams object for required properties and throws in
 * the event of any validation error for eth_signTypedMessage_V3.
 *
 * @param messageData - TypedMessageParams object to validate
 */
function validateTypedSignMessageDataV3(messageData) {
    if (!messageData.from || typeof messageData.from !== 'string' || !ethereumjs_util_1.isValidAddress(messageData.from)) {
        throw new Error(`Invalid "from" address: ${messageData.from} must be a valid string.`);
    }
    if (!messageData.data || typeof messageData.data !== 'string') {
        throw new Error(`Invalid message "data": ${messageData.data} must be a valid array.`);
    }
    let data;
    try {
        data = JSON.parse(messageData.data);
    }
    catch (e) {
        throw new Error('Data must be passed as a valid JSON string.');
    }
    const validation = jsonschema.validate(data, eth_sig_util_1.TYPED_MESSAGE_SCHEMA);
    if (validation.errors.length > 0) {
        throw new Error('Data must conform to EIP-712 schema. See https://git.io/fNtcx.');
    }
}
exports.validateTypedSignMessageDataV3 = validateTypedSignMessageDataV3;
/**
 * Validates a ERC20 token to be added with EIP747.
 *
 * @param token - Token object to validate
 */
function validateTokenToWatch(token) {
    const { address, symbol, decimals } = token;
    if (!address || !symbol || typeof decimals === 'undefined') {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Must specify address, symbol, and decimals.`);
    }
    if (typeof symbol !== 'string') {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid symbol: not a string.`);
    }
    if (symbol.length > 6) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid symbol "${symbol}": longer than 6 characters.`);
    }
    const numDecimals = parseInt(decimals, 10);
    if (isNaN(numDecimals) || numDecimals > 36 || numDecimals < 0) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid decimals "${decimals}": must be 0 <= 36.`);
    }
    if (!ethereumjs_util_1.isValidAddress(address)) {
        throw eth_rpc_errors_1.ethErrors.rpc.invalidParams(`Invalid address "${address}".`);
    }
}
exports.validateTokenToWatch = validateTokenToWatch;
/**
 * Returns wether the given code corresponds to a smart contract
 *
 * @returns {string} - Corresponding code to review
 */
function isSmartContractCode(code) {
    /* istanbul ignore if */
    if (!code) {
        return false;
    }
    // Geth will return '0x', and ganache-core v2.2.1 will return '0x0'
    const smartContractCode = code !== '0x' && code !== '0x0';
    return smartContractCode;
}
exports.isSmartContractCode = isSmartContractCode;
/**
 * Execute fetch and verify that the response was successful
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the fetch response
 */
function successfulFetch(request, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(request, options);
        if (!response.ok) {
            throw new Error(`Fetch failed with status '${response.status}' for request '${request}'`);
        }
        return response;
    });
}
exports.successfulFetch = successfulFetch;
/**
 * Execute fetch and return object response
 *
 * @param request - Request information
 * @param options - Options
 * @returns - Promise resolving to the result object of fetch
 */
function handleFetch(request, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield successfulFetch(request, options);
        const object = yield response.json();
        return object;
    });
}
exports.handleFetch = handleFetch;
/**
 * Fetch that fails after timeout
 *
 * @param url - Url to fetch
 * @param options - Options to send with the request
 * @param timeout - Timeout to fail request
 *
 * @returns - Promise resolving the request
 */
function timeoutFetch(url, options, timeout = 500) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.race([
            handleFetch(url, options),
            new Promise((_, reject) => setTimeout(() => {
                reject(new Error('timeout'));
            }, timeout)),
        ]);
    });
}
exports.timeoutFetch = timeoutFetch;
/**
 * Normalizes the given ENS name.
 *
 * @param {string} ensName - The ENS name
 *
 * @returns - the normalized ENS name string
 */
function normalizeEnsName(ensName) {
    if (ensName && typeof ensName === 'string') {
        try {
            const normalized = ensNamehash.normalize(ensName.trim());
            // this regex is only sufficient with the above call to ensNamehash.normalize
            // TODO: change 7 in regex to 3 when shorter ENS domains are live
            // eslint-disable-next-line require-unicode-regexp
            if (normalized.match(/^(([\w\d\-]+)\.)*[\w\d\-]{7,}\.(eth|test)$/)) {
                return normalized;
            }
        }
        catch (_) {
            // do nothing
        }
    }
    return null;
}
exports.normalizeEnsName = normalizeEnsName;
function calcTokenAmount(value, decimals) {
    const multiplier = Math.pow(10, Number(decimals || 0));
    return new bignumber_js_1.default(value).div(multiplier);
}
exports.calcTokenAmount = calcTokenAmount;
/**
 * Query format using current provided eth query object
 * @param method - Method to query
 * @param ethQuery - EthQuery object
 * @param args - Conveninent arguments to execute the query
 * @returns - Promise resolving to the respective result
 */
function query(method, ethQuery, args = []) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            ethQuery[method](...args, (error, result) => {
                /* istanbul ignore next */
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    });
}
exports.query = query;
/**
 * Estimates required gas for a given transaction
 *
 * @param transaction - Transaction object to estimate gas for
 * @returns - Promise resolving to an object containing gas and gasPrice
 */
function estimateGas(transaction, ethQuery) {
    return __awaiter(this, void 0, void 0, function* () {
        const estimatedTransaction = Object.assign({}, transaction);
        const { value, data } = estimatedTransaction;
        const { gasLimit } = yield query('getBlockByNumber', ethQuery, ['latest', false]);
        estimatedTransaction.data = !data ? data : /* istanbul ignore next */ ethereumjs_util_1.addHexPrefix(data);
        // 3. If this is a contract address, safely estimate gas using RPC
        estimatedTransaction.value = typeof value === 'undefined' ? '0x0' : /* istanbul ignore next */ value;
        const gasHex = yield query('estimateGas', ethQuery, [estimatedTransaction]);
        return { blockGasLimit: gasLimit, gas: ethereumjs_util_1.addHexPrefix(gasHex) };
    });
}
exports.estimateGas = estimateGas;
exports.default = {
    BNToHex,
    fractionBN,
    getBuyURL,
    handleFetch,
    hexToBN,
    hexToText,
    isSmartContractCode,
    constructTxParams,
    normalizeTransaction,
    safelyExecute,
    successfulFetch,
    timeoutFetch,
    validateTokenToWatch,
    validateTransaction,
    validateTypedSignMessageDataV1,
    validateTypedSignMessageDataV3,
    calcTokenAmount,
    estimateGas,
    query,
};
//# sourceMappingURL=util.js.map