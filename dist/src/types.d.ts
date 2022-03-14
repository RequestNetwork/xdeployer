export interface XdeployConfig {
    salt?: string;
    signer?: any;
    networks?: Array<string>;
    rpcUrls?: Array<any>;
    gasLimit?: number;
    deployerAddress?: string;
}
export interface IDeploymentParams {
    contract: string;
    constructorArgs?: Array<any>;
}
export interface IDeploymentResult {
    network: string;
    contract: string;
    address: string | undefined;
    receipt: any;
    deployed: boolean;
    error: string | undefined;
}
//# sourceMappingURL=types.d.ts.map