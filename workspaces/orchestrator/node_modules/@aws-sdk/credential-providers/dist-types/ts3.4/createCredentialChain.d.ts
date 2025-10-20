import { AwsCredentialIdentityProvider } from "@smithy/types";
export interface CustomCredentialChainOptions {
  expireAfter(
    milliseconds: number
  ): AwsCredentialIdentityProvider & CustomCredentialChainOptions;
}
export declare const createCredentialChain: (
  ...credentialProviders: AwsCredentialIdentityProvider[]
) => AwsCredentialIdentityProvider & CustomCredentialChainOptions;
