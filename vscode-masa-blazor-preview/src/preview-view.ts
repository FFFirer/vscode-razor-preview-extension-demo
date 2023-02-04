import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ApiService } from "./service";
import { SessionManager } from "./session";

export class RazorPreviewView {
    public constructor(private context: vscode.ExtensionContext, private externalApi: ApiService, private session : SessionManager) {
        
        const indexTemplatePath = path.resolve(__dirname, "../modules/webview/index.html");

        this.indexHtmlTemplate = fs.readFileSync(indexTemplatePath, 'utf-8')

    }

    private singlePreviewPanel: vscode.WebviewPanel | null = null;
    private singlePreviewPanelSourceTargetUri: vscode.Uri | null = null;

    private panel2EditorMap: Map<vscode.WebviewPanel, vscode.TextEditor> = new Map();

    private indexHtmlTemplate: string;

    /**格式化路径 */
    private formatPathIfNecessary(pathString: string) {
        if (process.platform === "win32") {
            pathString = pathString.replace(
                /^([a-zA-Z])\:\\/,
                (_, $1) => `${$1.toUpperCase()}:\\`
            );
        }
        return pathString;
    }

    /**获取打开的项目的目录 */
    private getProjectDirectoryPath(
        sourceUri: vscode.Uri,
        workspaceFolders: readonly vscode.WorkspaceFolder[] = []
    ) {
        const possibleWorkspaceFolders = workspaceFolders.filter(
            (workspaceFolder) => {
                return (
                    path
                        .dirname(sourceUri.path.toUpperCase())
                        .indexOf(workspaceFolder.uri.path.toUpperCase()) >= 0
                );
            }
        );

        let projectDirectoryPath;

        if (possibleWorkspaceFolders.length) {
            const workspaceFolder = possibleWorkspaceFolders.sort(
                (x, y) => y.uri.path.length - x.uri.path.length
            )[0];

            projectDirectoryPath = workspaceFolder.uri.fsPath;
        } else {
            projectDirectoryPath = "";
        }

        return this.formatPathIfNecessary(projectDirectoryPath);
    }

    /**获取指定文件的路径 */
    public getFilePath(sourceUri: vscode.Uri) {
        return this.formatPathIfNecessary(sourceUri.fsPath);
    }

    /**初始化webview */
    private initWebviewPanel(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn, preserveFocus?: boolean }
    ) {
        
        return new Promise((resolve, reject) => {
            if (!this.singlePreviewPanel) {
                let previewPanel: vscode.WebviewPanel;

                const localResourceRoots = [
                    vscode.Uri.file(this.context.extensionPath),
                    vscode.Uri.file(
                        this.getProjectDirectoryPath(
                            sourceUri,
                            vscode.workspace.workspaceFolders
                        ) || path.dirname(sourceUri.fsPath)
                    ),
                ];

                previewPanel = vscode.window.createWebviewPanel(
                    "razor-preview",
                    `Preview ${path.basename(sourceUri.fsPath)}`,
                    viewOptions,
                    {
                        enableScripts: true,
                        enableFindWidget: true,
                        localResourceRoots,
                    }
                );

                previewPanel.webview.onDidReceiveMessage(
                    (message) => { },
                    null,
                    this.context.subscriptions
                );

                previewPanel.onDidDispose(() => {

                    this.singlePreviewPanel = null;
                    this.singlePreviewPanelSourceTargetUri = null;

                }, null, this.context.subscriptions);


                const _this = this;


                previewPanel.webview.html = this.indexHtmlTemplate
                                                        .replace("@@baseUrl", this.externalApi.option.baseUrl!);

                this.singlePreviewPanel = previewPanel;
                this.panel2EditorMap.set(previewPanel, ediitor);

                this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`

                resolve(true);
            }
            else {
                this.singlePreviewPanel.reveal(viewOptions.viewColumn, viewOptions.preserveFocus);

                this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`

                resolve(false);
            }
        })
    }

    public init(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }
    ) {
        this.checkSession();
        
        this.initWebviewPanel(sourceUri, ediitor, viewOptions).then((first) => {
            if (first) {
                // 
                setTimeout(() => {
                    this.externalApi?.renderFileAsync({
                        filePath: sourceUri.fsPath
                    });
                }, 500);
            }

            this.externalApi?.renderFileAsync({
                filePath: sourceUri.fsPath
            });
        });

        // this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`;

    }

    protected checkSession(){
        this.session.checkRunning();
    }

    public initSelection(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn; preserveFocus?: boolean }
    ) {

        this.checkSession();
        // this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`;

        // let activeEditor = vscode.window.activeTextEditor;

        if (ediitor) {
            let selection = ediitor.selection

            let text = ediitor.document.getText(new vscode.Range(selection.start, selection.end));

            this.initWebviewPanel(sourceUri, ediitor, viewOptions).then((first) => {
                if (first) {
                    setTimeout(() => {
                        this.externalApi?.renderPlainAsync({
                            plainText: text
                        })
                    }, 500);
                } else {
                    this.externalApi?.renderPlainAsync({
                        plainText: text
                    });
                }
            })
        }
    }
}
