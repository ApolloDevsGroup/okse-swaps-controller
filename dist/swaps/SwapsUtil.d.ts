import BigNumber from 'bignumber.js';
import { APIAggregatorMetadata, SwapsAsset, SwapsToken, APIType, Quote, APIFetchQuotesParams, QuoteValues } from './SwapsInterfaces';
export declare const ETH_SWAPS_TOKEN_ADDRESS = "0x0000000000000000000000000000000000000000";
export declare const ETH_SWAPS_TOKEN_OBJECT: SwapsToken;
export declare const DEFAULT_ERC20_APPROVE_GAS = "0x1d4c0";
export declare const SWAPS_CONTRACT_ADDRESS = "0x881d40237659c251811cec9c364ef91dc08d300c";
export declare enum SwapsError {
    QUOTES_EXPIRED_ERROR = "quotes-expired",
    SWAP_FAILED_ERROR = "swap-failed-error",
    ERROR_FETCHING_QUOTES = "error-fetching-quotes",
    QUOTES_NOT_AVAILABLE_ERROR = "quotes-not-available",
    OFFLINE_FOR_MAINTENANCE = "offline-for-maintenance",
    SWAPS_FETCH_ORDER_CONFLICT = "swaps-fetch-order-conflict"
}
export declare const getBaseApiURL: (type: APIType) => string;
export declare function fetchTradesInfo({ slippage, sourceToken, sourceAmount, destinationToken, walletAddress, exchangeList }: APIFetchQuotesParams, abortSignal: AbortSignal): Promise<{
    [key: string]: Quote;
}>;
export declare function fetchTokens(): Promise<SwapsToken[]>;
export declare function fetchDEXTokens(): Promise<DEXToken[]>;
export declare function fetchDEXNetwork(token:DEXToken): Promise<DEXNetwork[]>;
export declare function createDEXRequestV2(payload:DEXSwapCreationRequestV2): Promise<DEXSwapCreation>;
export declare function findDEXSwapsV2(params:DEXSwapFindParams): Promise<DEXSwapDetail[]>;

export declare function getDEXCreateStatusV2(id:string): Promise<DEXSwapDetail>;

export declare function fetchAggregatorMetadata(): Promise<{
    [key: string]: APIAggregatorMetadata;
}>;
export declare function fetchTopAssets(): Promise<SwapsAsset[]>;
export declare function fetchSwapsFeatureLiveness(): Promise<boolean>;
export declare function fetchTokenPrice(address: string): Promise<string>;
export declare function fetchGasPrices(): Promise<{
    SafeGasPrice: string;
    ProposeGasPrice: string;
    FastGasPrice: string;
}>;
export declare function calculateGasEstimateWithRefund(maxGas: number | null, estimatedRefund: number | null, estimatedGas: string | null): BigNumber;
/**
 * Calculates the median of a sample of BigNumber values.
 *
 * @param {BigNumber[]} values - A sample of BigNumber values.
 * @returns {BigNumber} The median of the sample.
 */
export declare function getMedian(values: BigNumber[]): BigNumber;
/**
 * Calculates the median overallValueOfQuote of a sample of quotes.
 *
 * @param {Array} quotes - A sample of quote objects with overallValueOfQuote, ethFee, metaMaskFeeInEth, and ethValueOfTokens properties
 * @returns {Object} An object with the ethValueOfTokens, ethFee, and metaMaskFeeInEth of the quote with the median overallValueOfQuote
 */
export declare function getMedianEthValueQuote(quotes: QuoteValues[]): {
    ethFee: string;
    metaMaskFeeInEth: string;
    ethValueOfTokens: string;
};
