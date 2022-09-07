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
exports.SwapsController = void 0;
const bignumber_js_1 = require("bignumber.js");
const abort_controller_1 = require("abort-controller");
const BaseController_1 = require("../BaseController");
const util_1 = require("../util");
const SwapsUtil_1 = require("./SwapsUtil");
const { Mutex } = require('await-semaphore');
const abiERC20 = require('human-standard-token-abi');
const EthQuery = require('ethjs-query');
const Web3 = require('web3');
const QUOTE_POLLING_INTERVAL = 50 * 1000;
// The MAX_GAS_LIMIT is a number that is higher than the maximum gas costs we have observed on any aggregator
const MAX_GAS_LIMIT = 2500000;
class SwapsController extends BaseController_1.default {
    /**
     * Creates a SwapsController instance
     *
     * @param config - Initial options used to configure this controller
     * @param state - Initial state to set on this controller
     */
    constructor(config, state) {
        super(config, state);
        this.pollCount = 0;
        this.mutex = new Mutex();
        /**
         * Name of this controller used during composition
         */
        this.name = 'SwapsController';
        /**
         * List of required sibling controllers this controller needs to function
         */
        this.requiredControllers = ['NetworkController', 'TokenRatesController'];
        this.defaultConfig = {
            maxGasLimit: 2500000,
            pollCountLimit: 3,
            metaSwapAddress: SwapsUtil_1.SWAPS_CONTRACT_ADDRESS,
            fetchTokensThreshold: 1000 * 60 * 60 * 24,
            quotePollingInterval: QUOTE_POLLING_INTERVAL,
            provider: undefined,
        };
        this.defaultState = {
            quotes: {},
            quoteValues: {},
            fetchParams: {
                slippage: 0,
                sourceToken: '',
                sourceAmount: 0,
                destinationToken: '',
                walletAddress: '',
            },
            fetchParamsMetaData: {
                sourceTokenInfo: {
                    decimals: 0,
                    address: '',
                    symbol: '',
                },
                destinationTokenInfo: {
                    decimals: 0,
                    address: '',
                    symbol: '',
                },
                accountBalance: '0x',
            },
            topAggSavings: null,
            tokens: null,
            approvalTransaction: null,
            dexTokens:null,
            dexNetworks: null,
            quotesLastFetched: 0,
            errorKey: null,
            topAggId: null,
            dexTokensLastFetched:0,
            bridgeStatus: null,
            tokensLastFetched: 0,
            isInPolling: false,
            isInFetch: false,
            pollingCyclesLeft: (config === null || config === void 0 ? void 0 : config.pollCountLimit) || 3,
        };
        this.initialize();
    }
    /**
     * Fetch current gas price
     *
     * @returns - Promise resolving to the current gas price
     */
    getGasPrice() {
        return __awaiter(this, void 0, void 0, function* () {
            const { ProposeGasPrice } = yield SwapsUtil_1.fetchGasPrices();
            return (parseFloat(ProposeGasPrice) * 1000000000).toString(16);
        });
    }
    /**
     * Find best quote and quotes calculated values
     *
     * @param quotes - Array of quotes
     * @param customGasPrice - If defined, custom gas price used
     * @returns - Promise resolving to the best quote object and values from quotes
     */
    getBestQuoteAndQuotesValues(quotes, customGasPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            let topAggId = '';
            let overallValueOfBestQuoteForSorting = new bignumber_js_1.default(0);
            const quoteValues = {};
            const usedGasPrice = customGasPrice || (yield this.getGasPrice());
            const { destinationTokenInfo, destinationTokenConversionRate } = this.state.fetchParamsMetaData;
            Object.values(quotes).forEach((quote) => {
                var _a;
                const { aggregator, averageGas, maxGas, destinationAmount = 0, destinationToken, sourceAmount, sourceToken, trade, gasEstimate, gasEstimateWithRefund, fee: metaMaskFee, } = quote;
                // trade gas
                const tradeGasLimit = gasEstimateWithRefund && gasEstimateWithRefund !== 0
                    ? new bignumber_js_1.default(gasEstimateWithRefund)
                    : new bignumber_js_1.default(averageGas || MAX_GAS_LIMIT, 10);
                const calculatedMaxGasLimit = new bignumber_js_1.default(gasEstimate || averageGas).times(1.4, 10);
                const tradeMaxGasLimit = calculatedMaxGasLimit.toNumber() > maxGas ? calculatedMaxGasLimit : new bignumber_js_1.default(maxGas);
                // + approval gas if required
                const approvalGas = ((_a = this.state.approvalTransaction) === null || _a === void 0 ? void 0 : _a.gas) || '0x0';
                const totalGasLimit = tradeGasLimit.plus(approvalGas, 16);
                const maxTotalGasLimit = tradeMaxGasLimit.plus(approvalGas, 16);
                const totalGasInWei = totalGasLimit.times(usedGasPrice, 16);
                const maxTotalGasInWei = maxTotalGasLimit.times(usedGasPrice, 16);
                // totalGas + trade value
                // trade.value is a sum of different values depending on the transaction.
                // It always includes any external fees charged by the quote source. In
                // addition, if the source asset is ETH, trade.value includes the amount
                // of swapped ETH.
                const totalInWei = totalGasInWei.plus(trade.value, 16);
                const maxTotalInWei = maxTotalGasInWei.plus(trade.value, 16);
                // if value in trade, ETH fee will be the gas, if not it will be the total wei
                const weiFee = sourceToken === SwapsUtil_1.ETH_SWAPS_TOKEN_ADDRESS ? totalInWei.minus(sourceAmount, 10) : totalInWei; // sourceAmount is in wei : totalInWei;
                const maxWeiFee = sourceToken === SwapsUtil_1.ETH_SWAPS_TOKEN_ADDRESS ? maxTotalInWei.minus(sourceAmount, 10) : maxTotalInWei; // sourceAmount is in wei : totalInWei;
                const ethFee = util_1.calcTokenAmount(weiFee, 18);
                const maxEthFee = util_1.calcTokenAmount(maxWeiFee, 18);
                const decimalAdjustedDestinationAmount = util_1.calcTokenAmount(destinationAmount, destinationTokenInfo.decimals);
                // fees
                const tokenPercentageOfPreFeeDestAmount = new bignumber_js_1.default(100, 10).minus(metaMaskFee, 10).div(100);
                const destinationAmountBeforeMetaMaskFee = decimalAdjustedDestinationAmount.div(tokenPercentageOfPreFeeDestAmount);
                const metaMaskFeeInTokens = destinationAmountBeforeMetaMaskFee.minus(decimalAdjustedDestinationAmount);
                const conversionRate = destinationTokenConversionRate || 1;
                const ethValueOfTokens = decimalAdjustedDestinationAmount.times(conversionRate, 10);
                // the more tokens the better
                const overallValueOfQuote = destinationToken === SwapsUtil_1.ETH_SWAPS_TOKEN_ADDRESS ? ethValueOfTokens.minus(ethFee, 10) : ethValueOfTokens;
                quoteValues[aggregator] = {
                    aggregator,
                    ethFee: ethFee.toFixed(18),
                    maxEthFee: maxEthFee.toFixed(18),
                    ethValueOfTokens: ethValueOfTokens.toFixed(18),
                    overallValueOfQuote: overallValueOfQuote.toFixed(18),
                    metaMaskFeeInEth: metaMaskFeeInTokens.times(conversionRate).toFixed(18),
                };
                if (overallValueOfQuote.gt(overallValueOfBestQuoteForSorting)) {
                    topAggId = aggregator;
                    overallValueOfBestQuoteForSorting = overallValueOfQuote;
                }
            });
            return { topAggId, quoteValues };
        });
    }
    /**
     * Calculate savings from quotes
     *
     * @param quotes - Quotes to do the calculation
     * @param values - Swaps ETH values, all quotes fees and all quotes trade values
     * @returns - Promise resolving to an object containing best aggregator id and respective savings
     */
    calculateSavings(quote, quoteValues) {
        return __awaiter(this, void 0, void 0, function* () {
            const { ethFee: medianEthFee, metaMaskFeeInEth: medianMetaMaskFee, ethValueOfTokens: medianEthValueOfTokens, } = SwapsUtil_1.getMedianEthValueQuote(Object.values(quoteValues));
            const bestTradeFee = quoteValues[quote.aggregator];
            // Performance savings are calculated as:
            //   (ethValueOfTokens for the best trade) - (ethValueOfTokens for the media trade)
            const performance = new bignumber_js_1.default(bestTradeFee.ethValueOfTokens, 10).minus(medianEthValueOfTokens, 10);
            // Fee savings are calculated as:
            //   (fee for the median trade) - (fee for the best trade)
            const fee = new bignumber_js_1.default(medianEthFee).minus(bestTradeFee.ethFee, 10);
            const metaMaskFee = bestTradeFee.metaMaskFeeInEth;
            // Total savings are calculated as:
            //   performance savings + fee savings - metamask fee
            const total = performance.plus(fee).minus(metaMaskFee);
            return { performance, total, fee, medianMetaMaskFee: new bignumber_js_1.default(medianMetaMaskFee) };
        });
    }
    /**
     * Get current allowance for a wallet address to access ERC20 contract address funds
     *
     * @param contractAddress - Hex address of the ERC20 contract
     * @param walletAddress - Hex address of the wallet
     * @returns - Promise resolving to allowance number
     */
    getERC20Allowance(contractAddress, walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const contract = this.web3.eth.contract(abiERC20).at(contractAddress);
            return new Promise((resolve, reject) => {
                contract.allowance(walletAddress, SwapsUtil_1.SWAPS_CONTRACT_ADDRESS, (error, result) => {
                    /* istanbul ignore if */
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve(result);
                });
            });
        });
    }
    timedoutGasReturn(tradeTxParams) {
        if (!tradeTxParams) {
            return new Promise((resolve) => {
                resolve({ gas: null });
            });
        }
        const gasTimeout = new Promise((resolve) => {
            setTimeout(() => {
                resolve({ gas: null });
            }, 5000);
        });
        return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
            const tradeTxParamsForGasEstimate = {
                data: tradeTxParams.data,
                from: tradeTxParams.from,
                to: tradeTxParams.to,
                value: tradeTxParams.value,
            };
            try {
                const gas = (yield Promise.race([
                    util_1.estimateGas(tradeTxParamsForGasEstimate, this.ethQuery),
                    gasTimeout,
                ]));
                resolve(gas);
            }
            catch (e) {
                resolve({ gas: null });
            }
        }));
    }
    set provider(provider) {
        if (provider) {
            this.ethQuery = new EthQuery(provider);
            this.web3 = new Web3(provider);
        }
    }
    /**
     * Starts a new polling process
     *
     */
    pollForNewQuotes() {
        return __awaiter(this, void 0, void 0, function* () {
            // We only want to do up to a maximum of three requests from polling.
            this.pollCount += 1;
            if (this.pollCount < this.config.pollCountLimit + 1) {
                this.update({ isInPolling: true, pollingCyclesLeft: this.config.pollCountLimit - this.pollCount });
                this.handle && clearTimeout(this.handle);
                yield this.fetchAndSetQuotes();
                this.handle = setTimeout(() => {
                    this.pollForNewQuotes();
                }, this.config.quotePollingInterval);
            }
            else {
                this.stopPollingAndResetState(SwapsUtil_1.SwapsError.QUOTES_EXPIRED_ERROR);
            }
        });
    }
    getAllQuotesWithGasEstimates(trades) {
        return __awaiter(this, void 0, void 0, function* () {
            const quoteGasData = yield Promise.all(Object.values(trades).map((trade) => {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const { gas } = yield this.timedoutGasReturn(trade.trade);
                        resolve({
                            gas,
                            aggId: trade.aggregator,
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                }));
            }));
            const newQuotes = {};
            quoteGasData.forEach(({ gas, aggId }) => {
                newQuotes[aggId] = Object.assign(Object.assign({}, trades[aggId]), { gasEstimate: gas, gasEstimateWithRefund: SwapsUtil_1.calculateGasEstimateWithRefund(trades[aggId].maxGas, trades[aggId].estimatedRefund, gas).toNumber() });
            });
            return newQuotes;
        });
    }
    fetchAndSetQuotes() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { fetchParams, customGasPrice } = this.state;
            this.update({ isInFetch: true });
            try {
                /** We need to abort quotes fetch if stopPollingAndResetState is called while getting quotes */
                this.abortController = new abort_controller_1.default();
                const { signal } = this.abortController;
                let quotes = yield SwapsUtil_1.fetchTradesInfo(fetchParams, signal);
                if (Object.values(quotes).length === 0) {
                    throw new Error(SwapsUtil_1.SwapsError.QUOTES_NOT_AVAILABLE_ERROR);
                }
                const quotesLastFetched = Date.now();
                let approvalTransaction = null;
                if (fetchParams.sourceToken !== SwapsUtil_1.ETH_SWAPS_TOKEN_ADDRESS) {
                    const allowance = yield this.getERC20Allowance(fetchParams.sourceToken, fetchParams.walletAddress);
                    if (Number(allowance) === 0 && this.pollCount === 1) {
                        approvalTransaction = Object.values(quotes)[0].approvalNeeded;
                        if (!approvalTransaction) {
                            throw new Error(SwapsUtil_1.SwapsError.ERROR_FETCHING_QUOTES);
                        }
                        const { gas: approvalGas } = yield this.timedoutGasReturn({
                            data: approvalTransaction.data,
                            from: approvalTransaction.from,
                            to: approvalTransaction.to,
                        });
                        approvalTransaction = Object.assign(Object.assign({}, approvalTransaction), { gas: approvalGas || SwapsUtil_1.DEFAULT_ERC20_APPROVE_GAS });
                    }
                }
                quotes = yield this.getAllQuotesWithGasEstimates(quotes);
                const { topAggId, quoteValues } = yield this.getBestQuoteAndQuotesValues(quotes, customGasPrice);
                const savings = yield this.calculateSavings(quotes[topAggId], quoteValues);
                this.state.isInPolling &&
                    this.update({
                        quotes,
                        quotesLastFetched,
                        approvalTransaction,
                        topAggId: (_a = quotes[topAggId]) === null || _a === void 0 ? void 0 : _a.aggregator,
                        topAggSavings: savings,
                        isInFetch: false,
                        quoteValues,
                    });
            }
            catch (e) {
                const error = Object.values(SwapsUtil_1.SwapsError).includes(e) ? e : SwapsUtil_1.SwapsError.ERROR_FETCHING_QUOTES;
                this.stopPollingAndResetState(error);
            }
        });
    }
    startFetchAndSetQuotes(fetchParams, fetchParamsMetaData, customGasPrice) {
        if (!fetchParams) {
            return null;
        }
        // Every time we get a new request that is not from the polling, we reset the poll count so we can poll for up to three more sets of quotes with these new params.
        this.pollCount = 0;
        this.update({
            customGasPrice,
            fetchParams,
            fetchParamsMetaData,
        });
        this.pollForNewQuotes();
    }
    fetchTokenWithCache() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.state.tokens || this.config.fetchTokensThreshold < Date.now() - this.state.tokensLastFetched) {
                const releaseLock = yield this.mutex.acquire();
                try {
                    const newTokens = yield SwapsUtil_1.fetchTokens();
                    this.update({ tokens: newTokens, tokensLastFetched: Date.now() });
                }
                finally {
                    releaseLock();
                }
            }
        });
    }
    fetchDEXTokenWithCache() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.config.fetchTokensThreshold < Date.now() - this.state.dexTokensLastFetched) {
                const releaseLock = yield this.mutex.acquire();
                try {
                    const newTokens = yield SwapsUtil_1.fetchDEXTokens();
                    let filtered = newTokens.filter(item => item.bscContractDecimal  &&  item.ethContractDecimal && item.enabled)
                    this.update({ dexTokens: filtered, dexTokensLastFetched: Date.now() });
                }
                finally {
                    releaseLock();
                }
            }
        });
    }

    fetchDEXNetwork(token){
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const newNetworks = yield SwapsUtil_1.fetchDEXNetwork(token);
                let filtered = newNetworks.filter(item => item.name !== 'BNB')
                this.update({ dexNetworks: filtered });
            }
            finally {
                releaseLock();
            }
        });
    }

    createDEXRequestV2(payload){
       
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const swapCreation = yield SwapsUtil_1.createDEXRequestV2(payload);
                console.log('createDEXRequestV2 controller swapCreation',swapCreation)

                if(swapCreation.code === 20000){
                    this.update({ bridgeStatus: swapCreation.data });
                }else{
                    this.update({ bridgeStatus: null });
                }
                
                return swapCreation;
            }
            finally {
                releaseLock();
            }
        });
    }

    findDEXSwapV2(id){
        console.log('findDEXSwapV2 controller')
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const swapDetails = yield SwapsUtil_1.findDEXSwapsV2(params);
                return swapDetails;
            }
            finally {
                releaseLock();
            }
        });
    }


    getDEXCreateStatusV2(id){
        return __awaiter(this, void 0, void 0, function* () {
            const releaseLock = yield this.mutex.acquire();
            try {
                const swapDetail = yield SwapsUtil_1.getDEXCreateStatusV2(id);
                // const testData =   {"actualFromAmount": 0.012, "actualNetworkFee": 0.00018, "actualSwapFee": 0, "actualToAmount": 0.012, "amount": 0.012, "createTime": "2021-02-18T04:39:40.000+00:00", "depositAddress": "0xedcdf4f4ff8374487a1afab8534de3b4dc65a0ac", "depositAddressLabel": "", "depositAddressLabelName": "", "depositReceivedConfirms": 12, "depositRequiredConfirms": 12, "depositTimeout": "2021-02-18T06:39:41.000+00:00", "depositTxId": "0xb1f7a10232dbd5bf642ae6ad32ec9278ce7efe76d4588aa1b213651d544416f1", "depositTxLink": "https://etherscan.io/tx/{txid}", "fromNetwork": "ETH", "id": "dad8608cf4f546188d3581010f3b2264", "networkFee": 0.00018, "networkFeePromoted": true, "status": "WithdrawInProgress", "swapFee": 0, "swapFeeRate": 0, "swapTxId": "0xed88c0e74ee42481f85c415b2e8f6b3c61042b5ae9777edcf50ed2180ef3ee8e", "swapTxLink": "https://bscscan.com/tx/{txid}", "symbol": "ETH", "toAddress": "0xb3b92aE612A4cFBF4f694b7C6c22363fbc493961", "toAddressLabel": "", "toNetwork": "BSC", "updateTime": "2021-02-18T05:49:26.000+00:00", "walletAddress": "0xb3b92aE612A4cFBF4f694b7C6c22363fbc493961", "walletNetwork": "ETH"}
                if(swapDetail &&  (swapDetail?.status === 'Completed' || swapDetail?.status === 'Cancelled')){
                    console.log('swapDetail?.status ',swapDetail?.status )
                    this.update({ bridgeStatus: null });
                    return null;
                }
                this.update({ bridgeStatus: swapDetail });
                return swapDetail;
            }
            finally {
                releaseLock();
            }
        });
    }

    safeRefetchQuotes() {
        const { fetchParams } = this.state;
        if (!this.handle && fetchParams) {
            this.fetchAndSetQuotes();
        }
    }
    /**
     * Stops the polling process
     *
     */
    stopPollingAndResetState(error) {
        this.abortController && this.abortController.abort();
        this.handle && clearTimeout(this.handle);
        this.pollCount = this.config.pollCountLimit + 1;
        this.update(Object.assign(Object.assign({}, this.defaultState), { isInPolling: false, isInFetch: false, tokensLastFetched: this.state.tokensLastFetched, tokens: this.state.tokens, errorKey: error }));
    }
}
exports.SwapsController = SwapsController;
exports.default = SwapsController;
//# sourceMappingURL=SwapsController.js.map