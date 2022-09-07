import BaseController, { BaseConfig, BaseState } from '../BaseController';
import { Transaction } from '../transaction/TransactionController';
import { SwapsError } from './SwapsUtil';
import { Quote, QuoteSavings, SwapsToken, APIFetchQuotesParams, APIFetchQuotesMetadata, DEXToken,QuoteValues } from './SwapsInterfaces';
export interface SwapsConfig extends BaseConfig {
    maxGasLimit: number;
    pollCountLimit: number;
    metaSwapAddress: string;
    fetchTokensThreshold: number;
    quotePollingInterval: number;
    provider: any;
}
export interface SwapsState extends BaseState {
    quotes: {
        [key: string]: Quote;
    };
    fetchParams: APIFetchQuotesParams;
    fetchParamsMetaData: APIFetchQuotesMetadata;
    topAggSavings: QuoteSavings | null;
    tokens: null | SwapsToken[];
    dexTokens: null | DEXToken[];
    dexNetworks: null | DEXNetwork[];
    quotesLastFetched: null | number;
    errorKey: null | SwapsError;
    topAggId: null | string;
    dexTokensLastFetched:number;
    tokensLastFetched: number;
    customGasPrice?: string;
    isInPolling: boolean;
    isInFetch: boolean;
    pollingCyclesLeft: number;
    approvalTransaction: Transaction | null;
    quoteValues: {
        [key: string]: QuoteValues;
    } | null;
}
export declare class SwapsController extends BaseController<SwapsConfig, SwapsState> {
    private handle?;
    private web3;
    private ethQuery;
    private pollCount;
    private mutex;
    private abortController?;
    /**
     * Fetch current gas price
     *
     * @returns - Promise resolving to the current gas price
     */
    private getGasPrice;
    /**
     * Find best quote and quotes calculated values
     *
     * @param quotes - Array of quotes
     * @param customGasPrice - If defined, custom gas price used
     * @returns - Promise resolving to the best quote object and values from quotes
     */
    private getBestQuoteAndQuotesValues;
    /**
     * Calculate savings from quotes
     *
     * @param quotes - Quotes to do the calculation
     * @param values - Swaps ETH values, all quotes fees and all quotes trade values
     * @returns - Promise resolving to an object containing best aggregator id and respective savings
     */
    private calculateSavings;
    /**
     * Get current allowance for a wallet address to access ERC20 contract address funds
     *
     * @param contractAddress - Hex address of the ERC20 contract
     * @param walletAddress - Hex address of the wallet
     * @returns - Promise resolving to allowance number
     */
    private getERC20Allowance;
    private timedoutGasReturn;
    /**
     * Name of this controller used during composition
     */
    name: string;
    /**
     * List of required sibling controllers this controller needs to function
     */
    requiredControllers: never[];
    /**
     * Creates a SwapsController instance
     *
     * @param config - Initial options used to configure this controller
     * @param state - Initial state to set on this controller
     */
    constructor(config?: Partial<SwapsConfig>, state?: Partial<SwapsState>);
    set provider(provider: any);
    setDEXTokens(newTokens: null | DEXToken[]): void;
    /**
     * Starts a new polling process
     *
     */
    pollForNewQuotes(): Promise<void>;
    getAllQuotesWithGasEstimates(trades: {
        [key: string]: Quote;
    }): Promise<{
        [key: string]: Quote;
    }>;
    fetchAndSetQuotes(): Promise<void>;
    startFetchAndSetQuotes(fetchParams: APIFetchQuotesParams, fetchParamsMetaData: APIFetchQuotesMetadata, customGasPrice?: string): null | undefined;
    fetchTokenWithCache(): Promise<void>;
    fetchDEXTokenWithCache(): Promise<void>;
    fetchDEXNetwork(token:DEXToken): Promise<void>;
    createDEXRequestV2(payload:DEXSwapCreationRequestV2): Promise<DEXSwapCreation>;
    findDEXSwapV2(params:DEXSwapFindParams): Promise<void>;
    getDEXCreateStatusV2(id:string): Promise<DEXSwapDetail>;
    safeRefetchQuotes(): void;
    /**
     * Stops the polling process
     *
     */
    stopPollingAndResetState(error?: SwapsError): void;
}
export default SwapsController;
