import BigNumber from 'bignumber.js';
import { Transaction } from '../transaction/TransactionController';
export declare enum APIType {
    TRADES = "TRADES",
    TOKENS = "TOKENS",
    TOP_ASSETS = "TOP_ASSETS",
    FEATURE_FLAG = "FEATURE_FLAG",
    AGGREGATOR_METADATA = "AGGREGATOR_METADATA",
    DEX_TOKENS = "DEX_TOKENS",
    DEX_NETWORKS = "DEX_NETWORKS",
    DEX_CREATE = "DEX_CREATE"
    GAS_PRICES = "GAS_PRICES"
}
export interface SwapsAsset {
    address: string;
    symbol: string;
    name?: string;
}
export interface SwapsToken extends SwapsAsset {
    decimals: number;
    occurances?: number;
    iconUrl?: string;
}
export interface DEXToken {
    decimals: number;
    occurances?: number;
    iconUrl?: string;
    name:string;	
    symbol:	string;
    bcSymbol:string;	
    ethSymbol:string;	
    icon:string;
    minAmount:number;	
    maxAmount:number;	
    promotion:boolean;	
    enabled:boolean;	
    bscContractAddress:	string;	
    bscContractDecimal:	number;	
    ethContractAddress:string;	
    ethContractDecimal:	number;
}



export interface DEXNetwork {
    name:	string;
    symbol:	string;		
    swapFeeRate:	number;		
    networkFee:	number;
    supportLabel:	boolean;		
    labelName:	string	;
    labelRegex:	string	;	
    txUrl	:number		;
    depositEnabled:	boolean;		
    withdrawEnabled:	boolean;		
    withdrawAmountUnit:	number	;	
    addressRegex:	string		;
    tokenStandard:	string		;
    requiredConfirms:	number;
}

export interface DEXSwapDetail {
    id:	string;	
    createTime:	Date;	
    updateTime:	Date;	
    walletAddress:	string;
    walletNetwork:	string;
    symbol:	string		;
    amount:	number;
    fromNetwork:	string;	
    toNetwork:	string		;
    toAddress:	string	;		
    toAddressLabel:	string;		
    networkFee:	number;	
    networkFeePromoted:	boolean;	
    swapFee:	number;		
    swapFeeRate:	number;	
    depositAddress:	string;		
    depositAddressLabel:	string;		
    depositTimeout:	Date;	
    depositTxId:	string;		
    depositTxLink:	string;	
    depositReceivedConfirms:	number;		
    depositRequiredConfirms:	number;		

    swapTxId:	string;		
    swapTxLink:	string;		

    actualFromAmount:	number;
    actualNetworkFee:	number;		
    actualSwapFee:	number	;
    actualToAmount:	number	;	

    direction:	string;		
    status:	string;		
}

export interface DEXSwapCreation {
    amount:	number;		
    createTime:	Date;		
    depositAddress:	string;		
    depositAddressLabel:	string;		
    depositTimeout:	Date;		
    direction:	string;		
    fromNetwork:	string;		
    id:	string;		
    networkFee:	number;		
    networkFeePromoted:	boolean;		
    status:	string;		
    swapFee:	number;		
    swapFeeRate:	number;		
    symbol:	string;		
    toAddress:	string;		
    toAddressLabel:	string;		
    toNetwork:	string;		
    walletAddress:	string;

}

export interface ResponseStatusBodySwapCreation {
    code:number;
    date:DEXSwapCreation;
    message:string;
}

export interface DEXSwapCreationRequestV2 {
    amount:	number	;	
    fromNetwork:	string;		
    source:	number;
    symbol:	string;		
    toAddress:	string		
    toAddressLabel:	string;		
    toNetwork:	string	;	
    walletAddress:	string;		
    walletNetwork:	string;	
}

export interface DEXSwapFindParams {
    endTime	:	number;
    limit:number;
    offset:	number;
    startTime	:	number;
    status	:[ string ];
    symbol:	string;
    walletAddress:string;
}


export interface SwapsQuoteSavings {
    total: BigNumber;
    performance: BigNumber;
    fee: BigNumber;
}
export interface SwapsQuote {
    topAggId: string;
    ethTradeValueOfBestQuote: BigNumber;
    ethFeeForBestQuote: BigNumber;
    isBest?: boolean;
    sourceTokenInfo?: string;
    destinationTokenInfo?: SwapsToken;
    gasEstimateWithRefund?: BigNumber;
    gasEstimate?: number;
    savings?: SwapsQuoteSavings;
}
export interface SwapsAllValues {
    allEthTradeValues: BigNumber[];
    allEthFees: BigNumber[];
}
export interface APITradeRequest {
    sourceToken: string;
    destinationToken: string;
    sourceAmount: string;
    slippage: number;
    excludeFees?: boolean;
    txOriginAddress?: string;
    timeout: number;
    walletAddress: string;
    exchangeList?: string[];
}
export interface APIFetchQuotesMetadata {
    sourceTokenInfo: SwapsToken;
    destinationTokenInfo: SwapsToken;
    accountBalance: string;
    destinationTokenConversionRate?: string;
}
/**
 * Parameters needed to fetch quotes
 *
 * @interface APIFetchQuotesParams
 *
 * @property slippage - Slippage
 * @property sourceToken - Source token address
 * @property sourceAmount - Source token amount
 * @property destinationToken - Destination token address
 * @property walletAddress - Address to do the swap from
 * @property exchangeList
 * @property balanceError
 * @property metaData - Metadata needed to fetch quotes
 *
 */
export interface APIFetchQuotesParams {
    slippage: number;
    sourceToken: string;
    sourceAmount: number;
    destinationToken: string;
    walletAddress: string;
    exchangeList?: string[];
    balanceError?: boolean;
    timeout?: number;
}
/**
 * Aggregator metadata coming from API
 *
 * @interface APIAggregatorMetadata
 *
 */
export interface APIAggregatorMetadata {
    color: string;
    title: string;
    icon: string;
}
interface QuoteTransaction extends Transaction {
    value: string;
}
/**
 * Savings of a quote
 *
 * @interface QuoteSavings
 */
export interface QuoteSavings {
    total: BigNumber;
    performance: BigNumber;
    fee: BigNumber;
    medianMetaMaskFee: BigNumber;
}
/**
 * Trade data structure coming from API, together with savings and gas estimations.
 *
 * @interface Quote
 *
 * @property trade - The ethereum transaction data for the swap
 * @property approvalNeeded - Ethereum transaction to complete a ERC20 approval, if needed
 * @property sourceAmount - Amount in minimal unit to send
 * @property destinationAmount - Amount in minimal unit to receive
 * @property error - Trade error, if any
 * @property sourceToken - Source token address
 * @property destinationToken - Destination token address
 * @property maxGas - Maximum gas to use
 * @property averageGas - Average gas to use
 * @property estimatedRefund - Destination token address
 * @property fetchTime - Fetch time
 * @property fee - MetaMask fee
 * @property gasMultiplier
 * @property aggregator - Aggregator id
 * @property aggType - Aggregator type
 * @property priceSlippage - Price slippage information object
 * @property savings - Estimation of savings
 * @property gasEstimate - Estimation of gas
 * @property gasEstimateWithRefund - Estimation of gas with refund
 */
export interface Quote {
    trade: QuoteTransaction;
    approvalNeeded: null | {
        data: string;
        to: string;
        from: string;
        gas: string;
    };
    sourceAmount: string;
    destinationAmount: number;
    error: null | Error;
    sourceToken: string;
    destinationToken: string;
    maxGas: number;
    averageGas: number;
    estimatedRefund: number;
    fetchTime: number;
    aggregator: string;
    aggType: string;
    fee: number;
    gasMultiplier: number;
    savings: QuoteSavings | null;
    gasEstimate: string | null;
    gasEstimateWithRefund: number | null;
}
/**
 * Fees and values information for an aggregator
 *
 * @interface QuoteValues
 *
 * @property aggregator - Aggregator id
 * @property ethFee - Fee in ETH
 * @property maxEthFee - Maximum fee in ETH
 * @property ethValueOfTokens - Total value of tokens in ETH
 * @property overallValueOfQuote
 * @property metaMaskFeeInEth - MetaMask fee in ETH
 */
export interface QuoteValues {
    aggregator: string;
    ethFee: string;
    maxEthFee: string;
    ethValueOfTokens: string;
    overallValueOfQuote: string;
    metaMaskFeeInEth: string;
}
export {};
