import { CommandLineAction, type ICommandLineActionOptions } from '@rushstack/ts-command-line';
import { ApiModel } from '@microsoft/api-extractor-model';
export interface IBuildApiModelResult {
    apiModel: ApiModel;
    inputFolder: string;
    outputFolder: string;
}
export declare abstract class BaseAction extends CommandLineAction {
    private readonly _inputFolderParameter;
    private readonly _outputFolderParameter;
    protected constructor(options: ICommandLineActionOptions);
    protected buildApiModel(): IBuildApiModelResult;
    private _applyInheritDoc;
    /**
     * Copy the content from `sourceDocComment` to `targetDocComment`.
     * This code is borrowed from DocCommentEnhancer as a temporary workaround.
     */
    private _copyInheritedDocs;
}
//# sourceMappingURL=BaseAction.d.ts.map