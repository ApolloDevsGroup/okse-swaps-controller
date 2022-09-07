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
exports.getMedianEthValueQuote = exports.getMedian = exports.calculateGasEstimateWithRefund = exports.fetchGasPrices = exports.fetchTokenPrice = exports.fetchSwapsFeatureLiveness = exports.fetchTopAssets = exports.fetchAggregatorMetadata = exports.fetchTokens = exports.fetchTradesInfo = exports.getBaseApiURL = exports.SwapsError = exports.SWAPS_CONTRACT_ADDRESS = exports.DEFAULT_ERC20_APPROVE_GAS = exports.ETH_SWAPS_TOKEN_OBJECT = exports.ETH_SWAPS_TOKEN_ADDRESS = void 0;
const bignumber_js_1 = require("bignumber.js");
const util_1 = require("../util");
const SwapsInterfaces_1 = require("./SwapsInterfaces");
exports.ETH_SWAPS_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';
exports.ETH_SWAPS_TOKEN_OBJECT = {
    symbol: 'ETH',
    name: 'Ether',
    address: exports.ETH_SWAPS_TOKEN_ADDRESS,
    decimals: 18,
};
exports.DEFAULT_ERC20_APPROVE_GAS = '0x1d4c0';
// The MAX_GAS_LIMIT is a number that is higher than the maximum gas costs we have observed on any aggregator
const MAX_GAS_LIMIT = 2500000;
exports.SWAPS_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';
var SwapsError;
(function (SwapsError) {
    SwapsError["QUOTES_EXPIRED_ERROR"] = "quotes-expired";
    SwapsError["SWAP_FAILED_ERROR"] = "swap-failed-error";
    SwapsError["ERROR_FETCHING_QUOTES"] = "error-fetching-quotes";
    SwapsError["QUOTES_NOT_AVAILABLE_ERROR"] = "quotes-not-available";
    SwapsError["OFFLINE_FOR_MAINTENANCE"] = "offline-for-maintenance";
    SwapsError["SWAPS_FETCH_ORDER_CONFLICT"] = "swaps-fetch-order-conflict";
})(SwapsError = exports.SwapsError || (exports.SwapsError = {}));
// Functions
exports.getBaseApiURL = function (type) {
    switch (type) {
        case SwapsInterfaces_1.APIType.TRADES:
            return 'https://api.metaswap.codefi.network/trades';
        case SwapsInterfaces_1.APIType.TOKENS:
            return 'https://api.metaswap.codefi.network/tokens';
        case SwapsInterfaces_1.APIType.TOP_ASSETS:
            return 'https://api.metaswap.codefi.network/topAssets';
        case SwapsInterfaces_1.APIType.FEATURE_FLAG:
            return 'https://api.metaswap.codefi.network/featureFlag';
        case SwapsInterfaces_1.APIType.AGGREGATOR_METADATA:
            return 'https://api.metaswap.codefi.network/aggregatorMetadata';
        case SwapsInterfaces_1.APIType.GAS_PRICES:
            return 'https://api.metaswap.codefi.network/gasPrices';
        default:
            throw new Error('getBaseApiURL requires an api call type');
    }
};

exports.getDEXApiURL = function (type) {
    switch (type) {
        case SwapsInterfaces_1.APIType.DEX_TOKENS:
            return 'https://api.binance.org/bridge/api/v2/tokens';
        case SwapsInterfaces_1.APIType.DEX_NETWORKS:
            return 'https://api.binance.org/bridge/api/v2/tokens';
        case SwapsInterfaces_1.APIType.DEX_CREATE:
            return 'https://api.binance.org/bridge/api/v2/swaps';
        default:
            throw new Error('getBaseApiURL requires an api call type');
    }
};

function fetchTradesInfo({ slippage, sourceToken, sourceAmount, destinationToken, walletAddress, exchangeList }, abortSignal) {
    return __awaiter(this, void 0, void 0, function* () {
        const urlParams = {
            destinationToken,
            sourceToken,
            sourceAmount,
            slippage,
            timeout: 10000,
            walletAddress,
        };
        if (exchangeList) {
            urlParams.exchangeList = exchangeList;
        }
        const tradeURL = `${exports.getBaseApiURL(SwapsInterfaces_1.APIType.TRADES)}?${new URLSearchParams(urlParams).toString()}`;
        const tradesResponse = (yield util_1.timeoutFetch(tradeURL, { method: 'GET', signal: abortSignal }, 15000));
        const newQuotes = tradesResponse.reduce((aggIdTradeMap, quote) => {
            if (quote.trade && !quote.error) {
                const constructedTrade = util_1.constructTxParams({
                    to: quote.trade.to,
                    from: quote.trade.from,
                    data: quote.trade.data,
                    amount: util_1.BNToHex(new bignumber_js_1.default(quote.trade.value)),
                    gas: util_1.BNToHex(quote.maxGas),
                });
                let { approvalNeeded } = quote;
                if (approvalNeeded) {
                    approvalNeeded = util_1.constructTxParams(Object.assign({}, approvalNeeded));
                }
                return Object.assign(Object.assign({}, aggIdTradeMap), { [quote.aggregator]: Object.assign(Object.assign({}, quote), { slippage, trade: constructedTrade }) });
            }
            return aggIdTradeMap;
        }, {});
        return newQuotes;
    });
}
exports.fetchTradesInfo = fetchTradesInfo;
function fetchTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenUrl = exports.getBaseApiURL(SwapsInterfaces_1.APIType.TOKENS);
        const tokens = yield util_1.handleFetch(tokenUrl, { method: 'GET' });
        const filteredTokens = tokens.filter((token) => {
            return token.address !== exports.ETH_SWAPS_TOKEN_ADDRESS;
        });
        filteredTokens.push(exports.ETH_SWAPS_TOKEN_OBJECT);
        return filteredTokens;
    });
}
exports.fetchTokens = fetchTokens;
function fetchDEXTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenUrl = exports.getDEXApiURL(SwapsInterfaces_1.APIType.DEX_TOKENS);
        const data = yield util_1.handleFetch(tokenUrl, { method: 'GET' });
        if(data.code === 20000){
            let tokens =  data.data.tokens
            return tokens;
        }
        return null;
    });
}
exports.fetchDEXTokens = fetchDEXTokens;

function fetchDEXNetwork(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let tokenUrl = exports.getDEXApiURL(SwapsInterfaces_1.APIType.DEX_NETWORKS);
        tokenUrl += '/' + token.symbol + "/networks"
        const data = yield util_1.handleFetch(tokenUrl, { method: 'GET' });
        if(data.code === 20000){
            let networks =  data.data.networks
            return networks;
        }
        return null;
    });
}
exports.fetchDEXNetwork = fetchDEXNetwork;


function createDEXRequestV2(payload) {
    return __awaiter(this, void 0, void 0, function* () {
        let createUrl = exports.getDEXApiURL(SwapsInterfaces_1.APIType.DEX_CREATE);
        console.log('createDEXRequestV2 util',createUrl,payload)
        const data = yield util_1.handleFetch(createUrl, { method: 'POST',body: JSON.stringify(payload) ,	
            mode: 'cors',
            cache: 'default',
        	headers: {
                'Accept': '*/*',
                'Content-type': 'application/json',
		}});
        console.log('createDEXRequestV2 response:',data)
        return data;
    });
}
exports.createDEXRequestV2 = createDEXRequestV2;


function findDEXSwapsV2(params) {
    return __awaiter(this, void 0, void 0, function* () {
        let createUrl = exports.getDEXApiURL(SwapsInterfaces_1.APIType.DEX_CREATE);
        createUrl += '?walletAddress=' + params.walletAddress

        const data = yield util_1.handleFetch(createUrl, { method: 'GET' });
        console.log('findDEXSwapsV2',data,createUrl)
        if(data.code === 20000){
           
            return data.data;
        }
        return null;
    });
}
exports.findDEXSwapsV2 = findDEXSwapsV2;


function getDEXCreateStatusV2(id) {
    return __awaiter(this, void 0, void 0, function* () {
        let createUrl = exports.getDEXApiURL(SwapsInterfaces_1.APIType.DEX_CREATE);
        createUrl += '/' + id

        const data = yield util_1.handleFetch(createUrl, { method: 'GET' });
        
        if(data.code === 20000){
            return data.data;
        }
        return null;
    });
}
exports.getDEXCreateStatusV2 = getDEXCreateStatusV2;



function fetchAggregatorMetadata() {
    return __awaiter(this, void 0, void 0, function* () {
        const aggregatorMetadataUrl = exports.getBaseApiURL(SwapsInterfaces_1.APIType.AGGREGATOR_METADATA);
        const aggregators = yield util_1.handleFetch(aggregatorMetadataUrl, {
            method: 'GET',
        });
        return aggregators;
    });
}
exports.fetchAggregatorMetadata = fetchAggregatorMetadata;
function fetchTopAssets() {
    return __awaiter(this, void 0, void 0, function* () {
        const topAssetsUrl = exports.getBaseApiURL(SwapsInterfaces_1.APIType.TOP_ASSETS);
        const response = yield util_1.handleFetch(topAssetsUrl, { method: 'GET' });
        return response;
    });
}
exports.fetchTopAssets = fetchTopAssets;
function fetchSwapsFeatureLiveness() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const status = yield util_1.handleFetch(exports.getBaseApiURL(SwapsInterfaces_1.APIType.FEATURE_FLAG), { method: 'GET' });
            return status === null || status === void 0 ? void 0 : status.active;
        }
        catch (err) {
            return false;
        }
    });
}
exports.fetchSwapsFeatureLiveness = fetchSwapsFeatureLiveness;
function fetchTokenPrice(address) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const query = `contract_addresses=${address}&vs_currencies=eth`;
        const prices = yield util_1.handleFetch(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?${query}`, {
            method: 'GET',
        });
        return prices && ((_a = prices[address]) === null || _a === void 0 ? void 0 : _a.eth);
    });
}
exports.fetchTokenPrice = fetchTokenPrice;
function fetchGasPrices() {
    return __awaiter(this, void 0, void 0, function* () {
        const prices = yield util_1.handleFetch(exports.getBaseApiURL(SwapsInterfaces_1.APIType.GAS_PRICES), {
            method: 'GET',
        });
        return prices;
    });
}
exports.fetchGasPrices = fetchGasPrices;
function calculateGasEstimateWithRefund(maxGas, estimatedRefund, estimatedGas) {
    const maxGasMinusRefund = new bignumber_js_1.default(maxGas || MAX_GAS_LIMIT, 10).minus(estimatedRefund || 0);
    const estimatedGasBN = new bignumber_js_1.default(estimatedGas || '0');
    const gasEstimateWithRefund = maxGasMinusRefund.lt(estimatedGasBN) ? maxGasMinusRefund : estimatedGasBN;
    return gasEstimateWithRefund;
}
exports.calculateGasEstimateWithRefund = calculateGasEstimateWithRefund;
/**
 * Calculates the median of a sample of BigNumber values.
 *
 * @param {BigNumber[]} values - A sample of BigNumber values.
 * @returns {BigNumber} The median of the sample.
 */
function getMedian(values) {
    if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Expected non-empty array param.');
    }
    const sorted = [...values].sort((a, b) => {
        if (a.eq(b)) {
            return 0;
        }
        return a.lt(b) ? -1 : 1;
    });
    if (sorted.length % 2 === 1) {
        // return middle value
        return sorted[(sorted.length - 1) / 2];
    }
    // return mean of middle two values
    const upperIndex = sorted.length / 2;
    return sorted[upperIndex].plus(sorted[upperIndex - 1]).div(2);
}
exports.getMedian = getMedian;
/**
 * Calculates the median overallValueOfQuote of a sample of quotes.
 *
 * @param {Array} quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth, and ethValueOfTokens properties
 * @returns {Object} An object with the ethValueOfTokens, ethFee, and metaMaskFeeInEth of the quote with the median overallValueOfQuote
 */
function getMedianEthValueQuote(quotes) {
    if (!Array.isArray(quotes) || quotes.length === 0) {
        throw new Error('Expected non-empty array param.');
    }
    quotes.sort((quoteA, quoteB) => {
        const overallValueOfQuoteA = new bignumber_js_1.default(quoteA.overallValueOfQuote, 10);
        const overallValueOfQuoteB = new bignumber_js_1.default(quoteB.overallValueOfQuote, 10);
        if (overallValueOfQuoteA.eq(overallValueOfQuoteB)) {
            return 0;
        }
        return overallValueOfQuoteA.lt(overallValueOfQuoteB) ? -1 : 1;
    });
    if (quotes.length % 2 === 1) {
        // return middle values
        const medianOverallValue = quotes[(quotes.length - 1) / 2].overallValueOfQuote;
        const quotesMatchingMedianQuoteValue = quotes.filter((quote) => medianOverallValue === quote.overallValueOfQuote);
        return meansOfQuotesFeesAndValue(quotesMatchingMedianQuoteValue);
    }
    // return mean of middle two values
    const upperIndex = quotes.length / 2;
    const lowerIndex = upperIndex - 1;
    const overallValueAtUpperIndex = quotes[upperIndex].overallValueOfQuote;
    const overallValueAtLowerIndex = quotes[lowerIndex].overallValueOfQuote;
    const quotesMatchingUpperIndexValue = quotes.filter((quote) => overallValueAtUpperIndex === quote.overallValueOfQuote);
    const quotesMatchingLowerIndexValue = quotes.filter((quote) => overallValueAtLowerIndex === quote.overallValueOfQuote);
    const feesAndValueAtUpperIndex = meansOfQuotesFeesAndValue(quotesMatchingUpperIndexValue);
    const feesAndValueAtLowerIndex = meansOfQuotesFeesAndValue(quotesMatchingLowerIndexValue);
    return {
        ethFee: new bignumber_js_1.default(feesAndValueAtUpperIndex.ethFee, 10)
            .plus(feesAndValueAtLowerIndex.ethFee, 10)
            .dividedBy(2)
            .toString(10),
        metaMaskFeeInEth: new bignumber_js_1.default(feesAndValueAtUpperIndex.metaMaskFeeInEth, 10)
            .plus(feesAndValueAtLowerIndex.metaMaskFeeInEth, 10)
            .dividedBy(2)
            .toString(10),
        ethValueOfTokens: new bignumber_js_1.default(feesAndValueAtUpperIndex.ethValueOfTokens, 10)
            .plus(feesAndValueAtLowerIndex.ethValueOfTokens, 10)
            .dividedBy(2)
            .toString(10),
    };
}
exports.getMedianEthValueQuote = getMedianEthValueQuote;
/**
 * Calculates the arithmetic mean for each of three properties - ethFee, metaMaskFeeInEth and ethValueOfTokens - across
 * an array of objects containing those properties.
 *
 * @param {Array} quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth and
 * ethValueOfTokens properties
 * @returns {Object} An object with the arithmetic mean each of the ethFee, metaMaskFeeInEth and ethValueOfTokens of
 * the passed quote objects
 */
function meansOfQuotesFeesAndValue(quotes) {
    const feeAndValueSumsAsBigNumbers = quotes.reduce((feeAndValueSums, quote) => ({
        ethFee: feeAndValueSums.ethFee.plus(quote.ethFee, 10),
        metaMaskFeeInEth: feeAndValueSums.metaMaskFeeInEth.plus(quote.metaMaskFeeInEth, 10),
        ethValueOfTokens: feeAndValueSums.ethValueOfTokens.plus(quote.ethValueOfTokens, 10),
    }), {
        ethFee: new bignumber_js_1.default(0, 10),
        metaMaskFeeInEth: new bignumber_js_1.default(0, 10),
        ethValueOfTokens: new bignumber_js_1.default(0, 10),
    });
    return {
        ethFee: feeAndValueSumsAsBigNumbers.ethFee.div(quotes.length, 10).toString(10),
        metaMaskFeeInEth: feeAndValueSumsAsBigNumbers.metaMaskFeeInEth.div(quotes.length, 10).toString(10),
        ethValueOfTokens: feeAndValueSumsAsBigNumbers.ethValueOfTokens.div(quotes.length, 10).toString(10),
    };
}
//# sourceMappingURL=SwapsUtil.js.map