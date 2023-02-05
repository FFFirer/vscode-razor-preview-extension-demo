import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ApiService } from "./service";
import { SessionManager } from "./session";
import { SessionManagerV2 } from "./session-v2";
import { ILogger } from "./logging";

enum RenderType {
    File = 1,
    PlainText = 2,
}

export class RenderBehavior {

    constructor(rType: RenderType, c: string) {
        this.renderType = rType;
        this.content = c;
    }

    renderType: RenderType;
    content: string;
}

export class RazorPreviewView {
    public constructor(
        private context: vscode.ExtensionContext,
        private externalApi: ApiService,
        private session: SessionManagerV2,
        private log: ILogger) {
        const indexTemplatePath = path.resolve(__dirname, "../modules/webview/index.html");

        this.indexHtmlTemplate = fs.readFileSync(indexTemplatePath, 'utf-8');
    }

    public reload() {
        if (this.lastRender) {
            this.log.write("Rerender Last Render")
            this.externalApi.renderAsync({
                renderType: this.lastRender.renderType === RenderType.File ? "RenderFromFile" : "RenderFromPlain",
                content: this.lastRender.content
            })
        }
    }

    private singlePreviewPanel: vscode.WebviewPanel | null = null;
    private singlePreviewPanelSourceTargetUri: vscode.Uri | null = null;

    // private panel2EditorMap: Map<vscode.WebviewPanel, vscode.TextEditor> = new Map();

    private indexHtmlTemplate: string;

    private lastRender: RenderBehavior | undefined = undefined;

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

                this.log.write("开始初始化webview");

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
                    (message) => {
                        // this.log.write("Received From WebView", JSON.stringify(message.data));
                        if(message.event){
                            if(message.event === 'loaded'){
                                _this.reload();
                            }
                        }
                    },
                    null,
                    this.context.subscriptions
                );

                previewPanel.onDidDispose(() => {

                    this.log.write("预览窗口关闭");

                    this.singlePreviewPanel = null;
                    this.singlePreviewPanelSourceTargetUri = null;

                }, null, this.context.subscriptions);


                const _this = this;

                previewPanel.webview.html = this.indexHtmlTemplate
                    .replace(/\@\@baseUrl/g, this.externalApi.option.baseUrl!);

                this.singlePreviewPanel = previewPanel;

                // this.panel2EditorMap.set(previewPanel, ediitor);

                this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`

                // this.singlePreviewPanel.webview.postMessage({
                //     'text': "hello world"
                // });

                resolve(true);
            }
            else {

                this.log.write("预览窗口已存在");

                this.singlePreviewPanel.reveal(viewOptions.viewColumn, viewOptions.preserveFocus);

                this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`

                resolve(false);
            }
        })
    }

    private setLastRender(renderType: RenderType, content: string) {
        this.lastRender = new RenderBehavior(renderType, content);
    }

    public init(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn, preserveFocus?: boolean }
    ) {
        this.setLastRender(RenderType.File, sourceUri.fsPath);

        this.log.write("预览文件：" + sourceUri.fsPath);

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

    public initSelection(
        sourceUri: vscode.Uri,
        ediitor: vscode.TextEditor,
        viewOptions: { viewColumn: vscode.ViewColumn, preserveFocus?: boolean }
    ) {
        // this.singlePreviewPanel!.title = `预览 ${path.basename(sourceUri.fsPath)}`;

        // let activeEditor = vscode.window.activeTextEditor;

        if (ediitor) {

            let selection = ediitor.selection

            this.log.write(`预览文件所选内容(${selection.start}, ${selection.end})：${sourceUri.fsPath}`);

            let text = ediitor.document.getText(new vscode.Range(selection.start, selection.end));

            this.setLastRender(RenderType.PlainText, text)

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
